/*
  Shortcut to document.querySelectorAll
 */
function qsa(sel){
    return document.querySelectorAll(sel);
}

/*
  qsa, but on an element
 */
function subqsa(el,sel){
    return el.querySelectorAll(sel);
}

/*
  Load a template
  
  returns the HTML
 */
function load_template(name){
    var content = qsa("template[name="+name+"]")[0].innerHTML;
    return content;
}

/*
  Load a script
  Returns the content
 */
function load_script(name){
    var content = qsa("script[name="+name+"]")[0].innerHTML;
    return content;
}

/*
  Create a dom element
 */
function new_el(html){
    var node = document.createElement("div");
    node.innerHTML = html;
    return node.children[0];
}

/*
  Add some useful stuff for electrical engineering
 */
function eeify_mathjs(){
    math.import({
	/* Parallel resistors */
	LL: function(a,b){
	    var num = 0;
	    for(i in arguments){
		var arg = arguments[i];
		num += 1/arg;
	    }	
	    return 1 / num;
	}
    });
}

/*
  Make something appear "smoothly"
 */
function appear(el){
    var options = {
        max: 6,
        begin: function(el){
            el.style.position = "relative";
        },
        end: function(el){
            el.style.position = "";
        },
        step: function(el,step,max){
            var ratio = step / max;
            el.style.opacity = "0.0";
            el.style.opacity = 1.0 - ratio;
            el.style.left = -100 * ratio + "px";
        }
    };
    animate(el,options);
}

/*
  Make something flash
 */
function flash(el,color){
    var original_color;
    var options = {
        max: 2,
        time_step: 300,
        begin: function(el){
            original_color = el.style.backgroundColor;
            el.style.backgroundColor = color;
        },
        end: function(el){
            el.style.backgroundColor = original_color;
        },
        step: function(el,step,max){
        }
    };
    animate(el,options);
}

function animate(el,options,step){
    max = options.max;
    time_step = options.time_step || 33;
    if(step == undefined){
	step = max;
        options.begin(el);
    }
    if(step < 0){
        options.end(el);
	return;
    }

    options.step(el, step, max);
    
    setTimeout(
	function(){
	    animate(el, options, step - 1);
	},
	time_step
    );
}

function eecalc(root_el){
    eeify_mathjs();

    var scope = {};
    root_el.innerHTML = load_template("eecalc");
    var cells = subqsa(root_el,".eecalc-cells")[0];
    var cell_count;
    var exports = {};
    
    new_eecalc_cell("");

    function delete_cell(index){
	if(index != 0){
	    var cell = find_cell(index);
	    cells.removeChild(cell);
	    focus(index-1);
	}
	update_indices();
    }

    function delete_all(){
        cells.innerHTML = "";
    }

    function re_run(){
        scope = {};
        for(var i = 0; i < cells.children.length; i++){
            cells.children[i].calculate();
        }
    }

    exports.re_run = re_run;
    
    function load_json(data){
        var data = JSON.parse(data);
        var cells = data.cells;
        
        delete_all();
        
        for(var i = 0; i < cells.length; i++){
            new_eecalc_cell(cells[i]);
        }
    }

    exports.load_json = load_json;
    
    function get_json(){
        // TODO
    }
    
    exports.get_json = get_json;
        
    function focus(index){
	var cell = find_cell(index);
	var input = subqsa(cell,".eecalc-input")[0];
	input.focus();
    }
    
    function find_cell(index){
	return cells.children[index];
    }

    function update_indices(){
	var i = 0;
	for(i = 0; i < cells.children.length; i++){
	    var cell = cells.children[i];
	    cell.setAttribute("data-index", i);
	    subqsa(cell,".eecalc-input")[0]
		.setAttribute("tabindex", i + 1);
	}
	cell_count = i;
    }
    
    function new_eecalc_cell(content){
	var cell = new_el(load_template("eecalc-cell"));
	cells.appendChild(cell);
	update_indices();
	
	var input = subqsa(cell,".eecalc-input")[0];
	var button = subqsa(cell,".eecalc-go-button")[0];
	var output = subqsa(cell,".eecalc-output")[0];
        
	appear(cell);
        input.value = content;
	input.focus();

	function get_index(){
	    return parseInt(cell.getAttribute("data-index"));
	}

        cell.calculate = calculate;
        
	function calculate(){
	    var text = ee_parse(get_value());
	    try{
		var result = math.eval(text, scope);
	    } catch (e){
		output.innerHTML = e;
		return;
	    }
	    
	    if(text == ""){
		return;
	    } else if(result != undefined){
		output.innerHTML = result;
	    } else {
		output.innerHTML = result;
		return;
	    }

            flash(output,"#ffee55");
            
	    // If last cell, add new cell
	    if(get_index() == cell_count - 1){
		new_eecalc_cell("");
	    }
	    // Or move focus to next cell
	    else {
		subqsa(cells,".eecalc-input")[get_index() + 1].focus();
	    }
	}

	function get_value(){
	    return input.value;
	}

	input.onkeydown = function(e){
            if(e.code == "Enter" && !e.shiftKey){
                e.preventDefault();
		calculate();
	     }
	    if(e.code == "Backspace"){
		// Delete cell
		if(get_value() == ""){
		    delete_cell(get_index());
		}
	    }
	}
        
        input.onkeyup = function(e){
	};
	
	button.onclick = calculate;
    }
    
    return exports;
}

// Replace electrical engineering notation
function ee_parse(str){
    str = str.replace(/([0-9]+)( *)G/g,  "$1E9");
    str = str.replace(/([0-9]+)( *)M/g,  "$1E6");
    str = str.replace(/([0-9]+)( *)meg/g,"$1E6");
    str = str.replace(/([0-9]+)( *)K/g,  "$1E3");
    str = str.replace(/([0-9]+)( *)k/g,  "$1E3");
    str = str.replace(/([0-9]+)( *)m/g,  "$1E-3");
    str = str.replace(/([0-9]+)( *)u/g,  "$1E-6");
    str = str.replace(/([0-9]+)( *)n/g,  "$1E-9");
    str = str.replace(/([0-9]+)( *)p/g,  "$1E-12");
    return str;
}

function init_starters(calc){
    var buttons = qsa(".starters button");

    for(var i = 0; i < buttons.length; i++){
        enable_click(buttons[i]);
    }
    
    function enable_click(el){
        el.onclick = function(){
            var name = el.name;
            var starter = load_script(name);
            calc.load_json(starter);
            calc.re_run();
        };
    }
}

// Start everything
var calc = eecalc(qsa("eecalc")[0]);
init_starters(calc);
