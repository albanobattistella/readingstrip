/*
  Reading Strip, Reading guide on the computer for people with dyslexia.
  Copyright (C) 2021 Luigi Pantano

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
const { St, Clutter, GObject, Meta, Shell, Gio } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PointerWatcher = imports.ui.pointerWatcher;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

// TODO: adjust interval value according to different frame rates of different monitor
const interval = 1000 / Clutter.get_default_frame_rate();

let panelButton, strip, pointerWatch;
let settings, setting_changed_signal_ids = [];
let currentMonitor = Main.layoutManager.currentMonitor;
let num_monitors = 1;
let monitor_change_signal_id = 0;

// panel menu
const ReadingStrip = GObject.registerClass(
	class ReadingStrip extends PanelMenu.Button {
		_init() {
			super._init(null, 'ReadingStrip');
			let panelButtonIcon = new St.Icon({
				gicon : Gio.icon_new_for_string(`${Extension.path}/icons/readingstrip_symbolic.svg`),
				style_class: 'system-status-icon',
				icon_size: '24',
			});

			this.add_actor(panelButtonIcon);
			this.connect('button-press-event', toggleReadingStrip);
		}
	}
);

// follow cursor position, and monitor as well
function syncStrip(x, y, monitor_changed = false) {
	if (monitor_changed || num_monitors > 1) {
		currentMonitor = Main.layoutManager.currentMonitor;
		strip.x = currentMonitor.x;
		strip.width = currentMonitor.width;
	}

	strip.y = (y - strip.height / 2);
}

// toggle strip on or off
function toggleReadingStrip() {
	if (strip.visible) {
		strip.visible = false;
		pointerWatch.remove();
		pointerWatch = null;
	}
	else {
		strip.visible = true;
		const [x, y] = global.get_pointer();
		syncStrip(x, y, true);
		const pointerWatcher = PointerWatcher.getPointerWatcher();
		pointerWatch = pointerWatcher.addWatch(interval, syncStrip);
	}
	settings.set_boolean('enabled', strip.visible);
}

// synchronize extension state with current settings
function syncSettings() {
	strip.style = 'background-color : ' + settings.get_string('readingstrip-color');
	strip.opacity = settings.get_uint('readingstrip-opacity');
	strip.height = settings.get_double('readingstrip-height') * currentMonitor.height/100;
}

// synchronize hot key
function syncHotKey(added) {
	if (settings.get_boolean('readingstrip-enable-hotkey')) {
		log('readingstrip: adding hotkey');
		Main.wm.addKeybinding('readingstrip-hotkey', settings,
			Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			Shell.ActionMode.ALL,
			() => {
				toggleReadingStrip();
			}
		);
	}
	else if (added) {
		log('readingstrip: removing hotkey');
		Main.wm.removeKeybinding('readingstrip-hotkey');
	}
}

function enable() {
	// get settings
	settings = ExtensionUtils.getSettings();

	// create strip
	strip = new St.Widget({
		reactive: false,
		can_focus: false,
		track_hover: false,
		visible: false
	});

	Main.uiGroup.add_child(strip);

	// load settings
	setting_changed_signal_ids.push(settings.connect('changed', syncSettings));
	log(`readingstrip: init sync settings`);
	syncSettings();
	syncHotKey(false);

	// hotkey 
	setting_changed_signal_ids.push(settings.connect('changed::enable-hotkey', () => {
		syncHotKey(true);
	}));

	// sync with current monitor
	const [x, y] = global.get_pointer();
	syncStrip(x, y, true);

	// load previous state
	if (settings.get_boolean('enabled')) {
		toggleReadingStrip();
	}

	// add button to top panel
	panelButton = new ReadingStrip();
	Main.panel.addToStatusArea('ReadingStrip', panelButton);

	// watch for monitor changes
	num_monitors = Main.layoutManager.monitors.length;
	monitor_change_signal_id = Main.layoutManager.connect('monitors-changed', () => {
		num_monitors = Main.layoutManager.monitors.length;
		const [x, y] = global.get_pointer();
		syncStrip(x, y, true);
	});
}

function disable() {
	// remove monitor change watch
	if (monitor_change_signal_id) {
		Main.layoutManager.disconnect(monitor_change_signal_id);
	}

	if (settings.get_boolean('readingstrip-enable-hotkey'))
		Main.wm.removeKeybinding('readingstrip-hotkey');
	setting_changed_signal_ids.forEach(id => settings.disconnect(id));
	setting_changed_signal_ids = [];
	settings = null;

	panelButton.destroy();
	panelButton = null;
	Main.uiGroup.remove_child(strip);

	if (pointerWatch) {
		pointerWatch.remove();
		pointerWatch = null;
	}

	if (strip) {
		strip.destroy;
		strip = null;
	}
}
