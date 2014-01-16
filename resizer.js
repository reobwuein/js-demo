/*
	Small resize script, dynamically updates font sizes in webview realtive to the window size. Simulating fluid font scaling for responsive views.
*/
function doResizeStuff (argument) {
		var min = 320,
		max = 1400,
		w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		bodyWidth = w.innerWidth || e.clientWidth || g.clientWidth;

	if( !window.matchMedia ) {
		min = 960;
	}


	if(bodyWidth < max+1 && bodyWidth > min){
		document.body.style.fontSize = ( bodyWidth *  .02 ) + "px";
	}else{
		var basescale = bodyWidth < max ? min : max;
		document.body.style.fontSize = ( basescale *  .02 ) + "px";
	}
}

(function(){
	doResizeStuff();
	if(!window.addEventListener){
		document.body.onresize = doResizeStuff;
		return;
	} 
	window.addEventListener('resize', doResizeStuff);
})();
