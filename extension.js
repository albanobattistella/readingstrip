/*
  Reading Strip, Reading guide on the computer for people with dyslexia.
  Copyright (C) 2021-25 Luigi Pantano

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
import St from 'gi://St';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { getPointerWatcher } from "resource:///org/gnome/shell/ui/pointerWatcher.js";

import {
  Extension,
  gettext as _,
} from 'resource:///org/gnome/shell/extensions/extension.js';

var Strip = GObject.registerClass(
class Strip extends St.Widget {
    _init(name) {
        super._init({
	    name: name,
            reactive: false,
            can_focus: false,
            track_hover: false,
            visible: false
        });
	
	this.locked = false;

        Main.uiGroup.add_child(this);
    }

    show_hide() {
        this.visible = !this.visible;
    }

    lock_unlock() {
	this.locked = !this.locked;
    }

    sync(y, monitor) {
	this.set_position(monitor.x, y);
        this.width = monitor.width;

        if (this.name != 'sMiddle') {
            this.height = monitor.height;
        }
    }

    destroy() {
        super.destroy();
    }
});

export default class ReadingStrip extends Extension {
    // follow cursor position and monitor as well
    syncStrip() {
	const currentMonitor = Main.layoutManager.currentMonitor;
	const [x, y] = global.get_pointer();
	
	if (this.sMiddle.visible == true && this.sMiddle.locked == false) {
	    this.sTop.sync(-currentMonitor.height + y - this.sMiddle.height / 2, currentMonitor);
	    this.sMiddle.sync(y - this.sMiddle.height / 2, currentMonitor);
	    this.sBottom.sync(y + this.sMiddle.height / 2, currentMonitor);
	}
    }

    // toggle strip on or off
    toggleStrip() {
	// Show or hide the stripes
	this.sMiddle.show_hide();
	
	if (this._settings.get_boolean('focusmode')) {
	    this.sTop.show_hide();
	    this.sBottom.show_hide();
	}
	
	// add or remove pointer watcher
	if (this.sMiddle.visible) {
	    this.pointerWatcher = getPointerWatcher();
	    this.pointerWatch = this.pointerWatcher.addWatch(
		this.refresh,
		this.syncStrip.bind(this)
	    );
	} else {
	    this.pointerWatch.remove();
	    this.pointerWatch = null;
	}
	
	// update icon status and switch status
	this._icon.gicon = this.sMiddle.visible ? this._icon_on : this._icon_off;
	this._buttonSwitchItem.setToggleState(this.sMiddle.visible);
    }

    onSettingsChanged() {
	// Get colors - use system theme if enabled
	let stripColor = this._settings.get_string('color-strip');
	let focusColor = this._settings.get_string('color-focus');
	
	if (this._settings.get_boolean('use-system-theme')) {
	    const themeContext = St.ThemeContext.get_for_stage(global.stage);
	    const theme = themeContext.get_theme();
	    // Use theme's accent color or fallback
	    stripColor = 'rgba(53, 132, 228, 0.8)'; // GNOME blue
	    focusColor = 'rgba(0, 0, 0, 0.75)';
	}

	// Apply daltonism filter
	const daltonismFilter = this._settings.get_string('daltonism-filter');
	if (daltonismFilter !== 'none') {
	    stripColor = this.applyDaltonismFilter(stripColor, daltonismFilter);
	}

	this.sMiddle.style = 'background-color : ' + stripColor + ';border: 1px solid #708090;';
	this.sMiddle.opacity = 255 * this._settings.get_double('opacity')/100;
	this.sMiddle.height = Main.layoutManager.currentMonitor.height * this._settings.get_double('height')/100;

	// Focus mode with custom dimensions
	const focusMode = this._settings.get_boolean('focusmode');
	this.sTop.visible = this.sBottom.visible = this.sMiddle.visible && focusMode;
	
	if (focusMode) {
	    const focusWidth = this._settings.get_double('focus-width');
	    const focusHeight = this._settings.get_double('focus-height');
	    const monitor = Main.layoutManager.currentMonitor;
	    
	    this.sMiddle.width = monitor.width * focusWidth / 100;
	    this.sMiddle.height = monitor.height * focusHeight / 100;
	}

	this.sTop.opacity = this.sBottom.opacity = 255 * 75/100;
	this.sTop.style = this.sBottom.style = 'background-color : ' + focusColor;

	this.refresh = this._settings.get_int('refresh');

	// Apply blur effect
	this.updateBlurEffect();
	
	// Apply cursor style
	this.updateCursorStyle();
	
	// Handle duplicate strips
	this.updateDuplicateStrips();
    }

    applyDaltonismFilter(color, filterType) {
	// Simple color transformation for color blindness
	// This is a basic implementation - real filters would be more complex
	const rgba = color.match(/\d+/g);
	if (!rgba || rgba.length < 3) return color;
	
	let [r, g, b] = rgba.map(Number);
	
	switch (filterType) {
	    case 'protanopia': // Red-blind
		r = 0.567 * r + 0.433 * g;
		g = 0.558 * r + 0.442 * g;
		break;
	    case 'deuteranopia': // Green-blind
		r = 0.625 * r + 0.375 * g;
		g = 0.7 * r + 0.3 * g;
		break;
	    case 'tritanopia': // Blue-blind
		r = 0.95 * r + 0.05 * b;
		b = 0.433 * g + 0.567 * b;
		break;
	}
	
	return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    }

    updateBlurEffect() {
	if (this._settings.get_boolean('blur-unfocused')) {
	    // Add blur effect to non-focused windows
	    const windows = global.get_window_actors();
	    windows.forEach(window => {
		if (window.meta_window !== global.display.focus_window) {
		    window.add_effect_with_name('blur', new Shell.BlurEffect());
		}
	    });
	} else {
	    // Remove blur effects
	    const windows = global.get_window_actors();
	    windows.forEach(window => {
		window.remove_effect_by_name('blur');
	    });
	}
    }

    updateCursorStyle() {
	const cursorStyle = this._settings.get_string('cursor-style');
	if (this.sMiddle.visible && cursorStyle !== 'default') {
	    global.screen.set_cursor(this.getCursorType(cursorStyle));
	} else {
	    global.screen.set_cursor(Meta.Cursor.DEFAULT);
	}
    }

    getCursorType(style) {
	switch (style) {
	    case 'crosshair': return Meta.Cursor.CROSSHAIR;
	    case 'pointer': return Meta.Cursor.POINTING_HAND;
	    case 'text': return Meta.Cursor.IBEAM;
	    default: return Meta.Cursor.DEFAULT;
	}
    }

    updateDuplicateStrips() {
	if (this._settings.get_boolean('duplicate-strips')) {
	    if (!this.sSecondary) {
		this.sSecondary = new Strip('sSecondary');
		this.sSecondary.style = this.sMiddle.style;
		this.sSecondary.opacity = this.sMiddle.opacity * 0.7;
		this.sSecondary.height = this.sMiddle.height;
	    }
	} else if (this.sSecondary) {
	    this.sSecondary.destroy();
	    this.sSecondary = null;
	}
    }

    syncStrip() {
	const currentMonitor = Main.layoutManager.currentMonitor;
	const [x, y] = global.get_pointer();
	
	if (this.sMiddle.visible == true && this.sMiddle.locked == false) {
	    this.sTop.sync(-currentMonitor.height + y - this.sMiddle.height / 2, currentMonitor);
	    this.sMiddle.sync(y - this.sMiddle.height / 2, currentMonitor);
	    this.sBottom.sync(y + this.sMiddle.height / 2, currentMonitor);
	    
	    // Sync secondary strip if enabled
	    if (this.sSecondary && this._settings.get_boolean('duplicate-strips')) {
		this.sSecondary.sync(y - this.sMiddle.height / 2 - 100, currentMonitor);
	    }
	}
    }
    
    enable() {
	// add Stripes
	this.sTop = new Strip('sTop');
	this.sMiddle = new Strip('sMiddle');
	this.sBottom = new Strip('sBottom');
	
	// add to top panel
	this._icon_on = Gio.icon_new_for_string(`${this.path}/icons/readingstrip-on-symbolic.svg`);
	this._icon_off = Gio.icon_new_for_string(`${this.path}/icons/readingstrip-off-symbolic.svg`);
	
	this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
	this._icon = new St.Icon({
	    gicon : this._icon_off,
	    style_class: 'system-status-icon',
	});	
        this._indicator.add_child(this._icon);
	
	this._buttonSwitchItem = new PopupMenu.PopupSwitchMenuItem(_('Show/Hide'), false, {});
	this._buttonSwitchItem.connect('toggled', () => {
            this.toggleStrip();
	});
	this._indicator.menu.addMenuItem(this._buttonSwitchItem);
	this._indicator.menu.addAction(
	    _('Settings...'),
	    () => this.openPreferences(),
	    'org.gnome.Settings-symbolic'
	);
	
	Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);

	// settings
	this._settings = this.getSettings();
	this._setting_changed_signal_ids = [];
	this._setting_changed_signal_ids.push(this._settings.connect('changed', () => {this.onSettingsChanged()}));
	this.onSettingsChanged();
	
	// synchronize hot key enable/disable
	Main.wm.addKeybinding('hotkey',
			      this._settings,
			      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			      Shell.ActionMode.ALL,
			      () => {
				  this.toggleStrip();
			      }
			     );
	// synchronize hot key lock/unlock
	Main.wm.addKeybinding('hotkey-locked',
			      this._settings,
			      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
			      Shell.ActionMode.ALL,
			      () => {
				  this.sMiddle.lock_unlock();
			      }
			     );
    }

    disable() {
	this._indicator.destroy();
	this._indicator = null;

	this.sTop.destroy();
	this.sMiddle.destroy();
	this.sBottom.destroy();
	
	if (this.sSecondary) {
	    this.sSecondary.destroy();
	    this.sSecondary = null;
	}

	// Remove blur effects
	const windows = global.get_window_actors();
	windows.forEach(window => {
	    window.remove_effect_by_name('blur');
	});

	// Reset cursor
	global.screen.set_cursor(Meta.Cursor.DEFAULT);

	this._setting_changed_signal_ids.forEach(id => this._settings.disconnect(id));
	this._setting_changed_signal_ids = [];
	this._settings = null;

	if (this.pointerWatch) {
	    this.pointerWatch.remove();
	    this.pointerWatch = null;
	}
	
	this.icon = null;
	this.icon_on = null;
	this.icon_off = null;

	Main.wm.removeKeybinding('hotkey');
	Main.wm.removeKeybinding('hotkey-locked');
    }
}

	this.pointerWatch.remove();
	this.pointerWatch = null;
	
	this.icon = null;
	this.icon_on = null;
	this.icon_off = null;

	Main.wm.removeKeybinding('hotkey');
	Main.wm.removeKeybinding('hotkey-locked');
    }
}
