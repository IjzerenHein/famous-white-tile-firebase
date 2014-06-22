/* 
 * Copyright (c) 2014 Gloey Apps
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2014
 */

/*jslint browser:true, nomen:true, vars:true, plusplus:true, bitwise: true*/
/*global define*/

define(function (require, exports, module) {
    'use strict';

    // import dependencies
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var View = require('famous/core/View');
    
    var StateModifier = require('famous/modifiers/StateModifier');
    var Easing = require('famous/transitions/Easing');
    var Transitionable = require('famous/transitions/Transitionable');
    var GridLayout = require('famous/views/GridLayout');

    /**
     * AppView
     * @class AppView
     * @extends View
     * @constructor
     * @param {Object} [options] Configuration options
     */
    function AppView(options) {
        View.apply(this, arguments);
        
        this.transitionable = new Transitionable(0);
        
        
        // Create rows
        this.rows = [];
        var i, j;
        for (i = 0; i <= this.options.rows; i++) {
            var row = {
                modifier: new Modifier({
                    size: [undefined, undefined]
                }),
                grid: new GridLayout({
                    dimensions: [this.options.cells, 1]
                }),
                cells: [],
                blackTile: -1
            };
            for (j = 0; j < this.options.cells; j++) {
                row.cells.push(new Surface({
                    size: [undefined, undefined],
                    classes: ['cell']
                }));
            }
            row.grid.sequenceFrom(row.cells);
            this.add(row.modifier).add(row.grid);
            this.rows.push(row);
        }
        
        // Create sample tile-data
        this.blackTiles = [
            0,
            1,
            2,
            3,
            3,
            3,
            2,
            2,
            0,
            3,
            0,
            0,
            1,
            3,
            2,
            1,
            1,
            0
        ];
        
        // Start transitionable
        var rowCount = 10000;
        this.transitionable.set(rowCount, {duration: rowCount * 1000});
    }
    AppView.prototype = Object.create(View.prototype);
    AppView.prototype.constructor = AppView;

    AppView.DEFAULT_OPTIONS = {
        rows: 4,
        cells: 4
    };

    /**
     * @method _createLaunchScreen
     * @private
     */
    AppView.prototype._createLaunchScreen = function () {
        
        
    };
    
    /**
     * Renders the view.
     *
     * @method render
     * @private
     * @ignore
     */
    AppView.prototype.render = function render() {
        
        var rowHeight = window.innerHeight / this.options.rows;
        //var rowIndex = this.transitionable.get() % this.rows.length;
        var i, j, y = 0;
        var rawOffset = this.transitionable.get();
        var offset = Math.floor(rawOffset);
        var start = offset % this.rows.length;
        for (i = 0; i < this.rows.length; i++) {
            var rowIndex = (i + start) % this.rows.length;
            var row = this.rows[rowIndex];
            
            // Positions the row
            row.modifier.sizeFrom([undefined, rowHeight]);
            row.modifier.transformFrom(
                Transform.translate(0, y, 0)
            );
            y += rowHeight;
            
            // Set black & white tiles for the row
            var blackTile = offset < this.blackTiles.length ? this.blackTiles[offset] : -1;
            if (row.blackTile !== blackTile) {
                if (row.blackTile !== -1) {
                    row.cells[row.blackTile].removeClass('black');
                }
                if (blackTile !== -1) {
                    row.cells[blackTile].addClass('black');
                }
                row.blackTile = blackTile;
            }
        }
        
        
        
        
        // Call super
        return this._node.render();
    };
        
    module.exports = AppView;
});
