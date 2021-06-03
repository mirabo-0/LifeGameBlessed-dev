#!/usr/bin/env node
'use strict';

var program = require('commander');
var blessed = require('blessed');
var fs = require('fs');
var path = require('path');
var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');
var Ticker = require(lib + '/ticker.js');
var App = require(lib + '/app.js');

program._name = 'blessed-life';

var configPath = path.resolve('example/test.json');
var json = fs.readFileSync(configPath, { encoding: 'utf-8' });
var configFile = JSON.parse(json);

var config = {
	width: (!isNaN(program.width) ? program.width : configFile.width || 0),
	height: (!isNaN(program.height) ? program.height : configFile.height || 0),
	liveCell: program.livecell || configFile.livecell || '█',
	deadCell: program.deadcell || configFile.deadcell || ' ',
	speed: program.speed || configFile.speed || 250,
	fg: program.fg || configFile.fg || 'white',
	bg: program.bg || configFile.bg || 'black',
	liveCells: configFile.liveCells || []
};

var screen = blessed.screen();

config.width = config.width || screen.width;
config.height = config.height || screen.height;

var app = new App(config);

// Create ui components
var box = blessed.box({
  top: '0',
  left: '0',
  width: 'shrink',
  height: 'shrink',
  content: app.renderBoard(),
  tags: true,
  clickable: true,
  border: {
	type: 'line',
	fg: 'blue'
  },
  style: {
    fg: config.fg,
    bg: config.bg,
  }
});
screen.append(box);

var spawnForm = blessed.form({
	left: 0,
	bottom: 0,
	width: '100%',
	height: 1,
	hidden: true
});
screen.append(spawnForm);

var spawnInput = blessed.textbox({
	left: spawnForm.content.length,
	bottom: 0,
	width: screen.width - spawnForm.content.length,
	height: 1,
	hidden: true
});
spawnForm.append(spawnInput);
// finished creating ui components

function onTick() {
	app.tick();
	box.setContent(app.renderBoard());
	screen.render();
}

var ticker = new Ticker(config.speed, onTick);
if (program.autostart) {
	ticker.start();
}

screen.key(['space'], function(ch, key) {
	if (!ticker.running) {
		onTick();
	}
});

screen.key(['f'], function(ch, key) {
	ticker.toggle();	
});

screen.key(['i'], function(ch, key) {
	if (ticker.running) {
		ticker.stop();
	}

	spawnForm.show();
	spawnInput.show();
	spawnInput.readInput(function onDone(err, value) {
		spawnForm.hide();
		spawnInput.hide();
		spawnInput.setValue('');

		if (value !== null) {
			value = value.split(/,|;/);
			for (var i = 0; i < value.length / 2; i++) {
				var x = parseInt(value[i * 2]);
				var y = parseInt(value[(i * 2) + 1]);

				if (app.game.board.isInBounds(x, y)) {
					app.game.board.toggleCell(x, y);
				}
			}
			box.setContent(app.renderBoard());
		}
		screen.render();
	});
	screen.render();
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();