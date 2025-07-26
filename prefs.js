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
'use strict';

import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Adw from "gi://Adw"; // TODO: use Adw widgets where possible
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class ReadingStripPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
	window._settings = this.getSettings();

	const page = new Adw.PreferencesPage();
	const group = new Adw.PreferencesGroup({}); // TODO: add groups: for settings, copyright, etc.
	const widgetPrefs = this.buildPrefsWidget();

	group.add(widgetPrefs);
	page.add(group);
	window.add(page);
    }

    buildPrefsWidget() {
	const settings = this.getSettings();
	const prefsWidget = new Gtk.Grid({
	    margin_start: 5,
	    margin_end: 5,
	    margin_top: 5,
	    margin_bottom: 5,
	    row_spacing: 10,
	    column_homogeneous: true,
	    visible: true
	});

	const shortcutsLabel = new Gtk.Label({
	    label: _('You can activate/deactive with <b>SUPER+CTRL+SPACE</b> or click on icon panel\nYou can lock/unlock movement with <b>SUPER+SHIFT+CTRL+SPACE</b>'),
	    halign: Gtk.Align.CENTER,
	    justify: Gtk.Align.CENTER,
	    useMarkup: true,
	    visible: true
	});
	prefsWidget.attach(shortcutsLabel, 0, 1, 2, 1);

	const sizeLabel = new Gtk.Label({
	    label: _('<b>Size</b> (%)'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(sizeLabel, 0, 2, 1, 1);

	const sizeSpinButton = new Gtk.SpinButton({
	    value: settings.get_double('height'),
	    digits: 1,
	    adjustment: new Gtk.Adjustment({
		lower: 1,
		upper: 100,
		step_increment: 0.5,
		page_increment: 1
	    }),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(sizeSpinButton, 1, 2, 1, 1);

	settings.bind(
	    'height',
	    sizeSpinButton,
	    'value',
	    Gio.SettingsBindFlags.DEFAULT
	);

	const opacityLabel = new Gtk.Label({
	    label: _('<b>Opacity</b> (%)'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(opacityLabel, 0, 3, 1, 1);

	const opacitySpinButton = new Gtk.SpinButton({
	    value: settings.get_double('opacity'),
	    digits: 1,
	    adjustment: new Gtk.Adjustment({
		lower: 0,
		upper: 100,
		step_increment: 5,
		page_increment: 20
	    }),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(opacitySpinButton, 1, 3, 1, 1);

	settings.bind(
	    'opacity',
	    opacitySpinButton,
	    'value',
	    Gio.SettingsBindFlags.DEFAULT
	);

	const refreshLabel = new Gtk.Label({
	    label: _('<b>Refresh</b> (ms)'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(refreshLabel, 0, 4, 1, 1);

	const refreshSpinButton = new Gtk.SpinButton({
	    value: settings.get_int('refresh'),
	    digits: 0,
	    adjustment: new Gtk.Adjustment({
		lower: 0,
		upper: 1000,
		step_increment: 5,
		page_increment: 50
	    }),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(refreshSpinButton, 1, 4, 1, 1);

	settings.bind(
	    'refresh',
	    refreshSpinButton,
	    'value',
	    Gio.SettingsBindFlags.DEFAULT
	);
	
	const colorStripLabel = new Gtk.Label({
	    label: _('<b>Strip Color</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(colorStripLabel, 0, 5, 1, 1);

	const colorStripButton = new Gtk.ColorButton({
	    halign: Gtk.Align.CENTER,
	    valign: Gtk.Align.CENTER,
	    visible: true
	});
	const rgba_strip = new Gdk.RGBA();
	rgba_strip.parse(settings.get_string('color-strip'));
	colorStripButton.rgba = rgba_strip;
	prefsWidget.attach(colorStripButton, 1, 5, 1, 1);

	colorStripButton.connect('color-set', () => {
	    settings.set_string('color-strip', colorStripButton.rgba.to_string());
	});

	const colorFocusLabel = new Gtk.Label({
	    label: _('<b>Color Focus</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(colorFocusLabel, 0, 6, 1, 1);

	const colorFocusButton = new Gtk.ColorButton({
	    halign: Gtk.Align.CENTER,
	    valign: Gtk.Align.CENTER,
	    visible: true
	});
	const rgba_focus = new Gdk.RGBA();
	rgba_focus.parse(settings.get_string('color-focus'));
	colorFocusButton.rgba = rgba_focus;
	prefsWidget.attach(colorFocusButton, 1, 6, 1, 1);

	colorFocusButton.connect('color-set', () => {
	    settings.set_string('color-focus', colorFocusButton.rgba.to_string());
	});

	const verticalLabel = new Gtk.Label({
	    label: _('<b>Vertical Strip</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(verticalLabel, 0, 7, 1, 1);

	const verticalCheckButton = new Gtk.Switch({
	    active: settings.get_boolean('vertical'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(verticalCheckButton, 1, 7, 1, 1);

	settings.bind(
	    'vertical',
	    verticalCheckButton,
	    'active',
	    Gio.SettingsBindFlags.DEFAULT
	);

	const focusStripLabel = new Gtk.Label({
	    label: _('<b>Focus strip</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(focusStripLabel, 0, 8, 1, 1);

	const focusStripCheckButton = new Gtk.Switch({
	    active: settings.get_boolean('focusmode'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(focusStripCheckButton, 1, 8, 1, 1);

	settings.bind(
	    'focusmode',
	    focusStripCheckButton,
	    'active',
	    Gio.SettingsBindFlags.DEFAULT
	);

	const profileLabel = new Gtk.Label({
	    label: _('<b>Profile</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(profileLabel, 0, 9, 1, 1);

	const buttonBox = new Gtk.FlowBox({
	    homogeneous: true,
	    visible: true
	});


	// Load Profile functionality
	const loadProfileButton = new Gtk.Button({
	    label: _('Load Profile'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	
	loadProfileButton.connect('clicked', () => {
	    const dialog = new Gtk.Dialog({
		title: _('Load Profile'),
		modal: true,
		transient_for: window
	    });
	    
	    const profileList = new Gtk.ListBox({
		visible: true
	    });
	    
	    const profiles = JSON.parse(settings.get_string('user-profiles') || '{}');
	    Object.keys(profiles).forEach(profileName => {
		const row = new Gtk.ListBoxRow({
		    visible: true
		});
		const label = new Gtk.Label({
		    label: profileName,
		    visible: true
		});
		row.set_child(label);
		profileList.append(row);
	    });
	    
	    profileList.connect('row-activated', (widget, row) => {
		const profileName = row.get_child().get_label();
		const profile = profiles[profileName];
		if (profile) {
		    settings.set_double('height', profile.height);
		    settings.set_double('opacity', profile.opacity);
		    settings.set_string('color-strip', profile.colorStrip);
		    settings.set_string('color-focus', profile.colorFocus);
		    settings.set_boolean('vertical', profile.vertical);
		    settings.set_boolean('focusmode', profile.focusmode);
		    if (profile.focusWidth) settings.set_double('focus-width', profile.focusWidth);
		    if (profile.focusHeight) settings.set_double('focus-height', profile.focusHeight);
		}
		dialog.close();
	    });
	    
	    dialog.get_content_area().append(profileList);
	    dialog.show();
	});
	
	prefsWidget.attach(loadProfileButton, 0, 20, 2, 1);

	prefsWidget.attach(buttonBox, 0, 10, 2, 1);

	const focusProfileButton = new Gtk.Button({
	    label: _('Focus Mode'),
	    halign: Gtk.Align.CENTER,
	    valign: Gtk.Align.CENTER,
	    visible: true
	});
	focusProfileButton.connect('clicked', () => {
	    settings.set_double('opacity', 0);
	    settings.set_double('height', 10);
	    settings.set_string('color-focus', 'rgb(0,0,0)');
	    settings.set_boolean('vertical', false);
	    settings.set_boolean('focusmode', true);
	});
	buttonBox.insert(focusProfileButton, 1);

	const rulesProfileButton = new Gtk.Button({
	    label: _('Rules'),
	    halign: Gtk.Align.CENTER,
	    valign: Gtk.Align.CENTER,
	    visible: true
	});
	rulesProfileButton.connect('clicked', () => {
	    settings.set_double('opacity', 100);
	    settings.set_double('height', 5);
	    settings.set_string('color-strip', 'rgb(246,211,45)');
	    settings.set_boolean('vertical', true);
	    settings.set_boolean('focusmode', false);
	});
	buttonBox.insert(rulesProfileButton, 2);

	const defaultProfileButton = new Gtk.Button({
	    label: _('Default'),
	    halign: Gtk.Align.CENTER,
	    valign: Gtk.Align.CENTER,
	    visible: true
	});
	defaultProfileButton.connect('clicked', () => {
	    settings.set_double('opacity', 35);
	    settings.set_int('refresh', 1);
	    settings.set_double('height', 2);
	    settings.set_string('color-strip', 'rgb(246,211,45)');
	    settings.set_string('color-focus', 'rgb(0,0,0)');
	    settings.set_boolean('vertical', false);
	    settings.set_boolean('focusmode', false);
	});
	buttonBox.insert(defaultProfileButton, 3);

	// System Theme
	const systemThemeLabel = new Gtk.Label({
	    label: _('<b>Use System Theme</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(systemThemeLabel, 0, 11, 1, 1);

	const systemThemeSwitch = new Gtk.Switch({
	    active: settings.get_boolean('use-system-theme'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(systemThemeSwitch, 1, 11, 1, 1);

	settings.bind(
	    'use-system-theme',
	    systemThemeSwitch,
	    'active',
	    Gio.SettingsBindFlags.DEFAULT
	);

	// Blur Unfocused Windows
	const blurLabel = new Gtk.Label({
	    label: _('<b>Blur Unfocused Windows</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(blurLabel, 0, 12, 1, 1);

	const blurSwitch = new Gtk.Switch({
	    active: settings.get_boolean('blur-unfocused'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(blurSwitch, 1, 12, 1, 1);

	settings.bind(
	    'blur-unfocused',
	    blurSwitch,
	    'active',
	    Gio.SettingsBindFlags.DEFAULT
	);

	// Focus Width
	const focusWidthLabel = new Gtk.Label({
	    label: _('<b>Focus Width</b> (%)'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(focusWidthLabel, 0, 13, 1, 1);

	const focusWidthSpinButton = new Gtk.SpinButton({
	    value: settings.get_double('focus-width'),
	    digits: 1,
	    adjustment: new Gtk.Adjustment({
		lower: 10,
		upper: 100,
		step_increment: 5,
		page_increment: 10
	    }),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(focusWidthSpinButton, 1, 13, 1, 1);

	settings.bind(
	    'focus-width',
	    focusWidthSpinButton,
	    'value',
	    Gio.SettingsBindFlags.DEFAULT
	);

	// Focus Height
	const focusHeightLabel = new Gtk.Label({
	    label: _('<b>Focus Height</b> (%)'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(focusHeightLabel, 0, 14, 1, 1);

	const focusHeightSpinButton = new Gtk.SpinButton({
	    value: settings.get_double('focus-height'),
	    digits: 1,
	    adjustment: new Gtk.Adjustment({
		lower: 10,
		upper: 100,
		step_increment: 5,
		page_increment: 10
	    }),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(focusHeightSpinButton, 1, 14, 1, 1);

	settings.bind(
	    'focus-height',
	    focusHeightSpinButton,
	    'value',
	    Gio.SettingsBindFlags.DEFAULT
	);

	// Daltonism Filter
	const daltonismLabel = new Gtk.Label({
	    label: _('<b>Color Blindness Filter</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(daltonismLabel, 0, 15, 1, 1);

	const daltonismCombo = new Gtk.ComboBoxText({
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	daltonismCombo.append('none', _('None'));
	daltonismCombo.append('protanopia', _('Protanopia'));
	daltonismCombo.append('deuteranopia', _('Deuteranopia'));
	daltonismCombo.append('tritanopia', _('Tritanopia'));
	daltonismCombo.set_active_id(settings.get_string('daltonism-filter'));
	prefsWidget.attach(daltonismCombo, 1, 15, 1, 1);

	daltonismCombo.connect('changed', () => {
	    settings.set_string('daltonism-filter', daltonismCombo.get_active_id());
	});

	// Duplicate Strips
	const duplicateLabel = new Gtk.Label({
	    label: _('<b>Multiple Strips</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(duplicateLabel, 0, 16, 1, 1);

	const duplicateSwitch = new Gtk.Switch({
	    active: settings.get_boolean('duplicate-strips'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(duplicateSwitch, 1, 16, 1, 1);

	settings.bind(
	    'duplicate-strips',
	    duplicateSwitch,
	    'active',
	    Gio.SettingsBindFlags.DEFAULT
	);

	// Cursor Style
	const cursorLabel = new Gtk.Label({
	    label: _('<b>Cursor Style</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(cursorLabel, 0, 17, 1, 1);

	const cursorCombo = new Gtk.ComboBoxText({
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	cursorCombo.append('default', _('Default'));
	cursorCombo.append('crosshair', _('Crosshair'));
	cursorCombo.append('pointer', _('Pointer'));
	cursorCombo.append('text', _('Text'));
	cursorCombo.set_active_id(settings.get_string('cursor-style'));
	prefsWidget.attach(cursorCombo, 1, 17, 1, 1);

	cursorCombo.connect('changed', () => {
	    settings.set_string('cursor-style', cursorCombo.get_active_id());
	});

	// User Profiles Section
	const profileSaveLabel = new Gtk.Label({
	    label: _('<b>Save Profile</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(profileSaveLabel, 0, 18, 1, 1);

	const profileNameEntry = new Gtk.Entry({
	    placeholder_text: _('Profile name'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(profileNameEntry, 1, 18, 1, 1);

	const saveProfileButton = new Gtk.Button({
	    label: _('Save Current Settings'),
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(saveProfileButton, 0, 19, 2, 1);

	saveProfileButton.connect('clicked', () => {
	    const profileName = profileNameEntry.get_text();
	    if (profileName) {
		const profiles = JSON.parse(settings.get_string('user-profiles') || '{}');
		profiles[profileName] = {
		    height: settings.get_double('height'),
		    opacity: settings.get_double('opacity'),
		    colorStrip: settings.get_string('color-strip'),
		    colorFocus: settings.get_string('color-focus'),
		    vertical: settings.get_boolean('vertical'),
		    focusmode: settings.get_boolean('focusmode'),
		    focusWidth: settings.get_double('focus-width'),
		    focusHeight: settings.get_double('focus-height')
		};
		settings.set_string('user-profiles', JSON.stringify(profiles));
		profileNameEntry.set_text('');
	    }
	});

	// Shortcut Configuration
	const shortcutLabel = new Gtk.Label({
	    label: _('<b>Keyboard Shortcuts</b>'),
	    halign: Gtk.Align.START,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(shortcutLabel, 0, 20, 2, 1);

	const hotkeyLabel = new Gtk.Label({
	    label: _('Toggle Strip:'),
	    halign: Gtk.Align.START,
	    visible: true
	});
	prefsWidget.attach(hotkeyLabel, 0, 21, 1, 1);

	const hotkeyEntry = new Gtk.Entry({
	    text: settings.get_strv('hotkey')[0] || '<Super><Control>space',
	    halign: Gtk.Align.CENTER,
	    visible: true
	});
	prefsWidget.attach(hotkeyEntry, 1, 21, 1, 1);

	hotkeyEntry.connect('changed', () => {
	    settings.set_strv('hotkey', [hotkeyEntry.get_text()]);
	});

	const aboutLabel = new Gtk.Label({
	    label: '<a href="https://github.com/lupantano/readingstrip">Reading Strip</a> Copyright (C) 2021-2025 <a href="https://matrix.to/#/@lupantano:matrix.org">Luigi Pantano</a>',
	    halign: Gtk.Align.CENTER,
	    justify: Gtk.Align.CENTER,
	    use_markup: true,
	    visible: true
	});
	prefsWidget.attach(aboutLabel, 0, 22, 2, 1);

	return prefsWidget;
    }
}
