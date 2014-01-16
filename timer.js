/*

Little timer framework build to be eager to fire events at the right 
time. Adds a tiny method to the thread before actual execution time 
and uses the js Date method to check if it's due by that time. this 
this tiny method will fire multiple times just before the actual time 
the eventhandler needs to be fired, trying to find a slot in the 
thread closer to the desired execution time

*/

function Timer(start, interval, timeUnit) {

	if(arguments.callee.instance)
		return arguments.callee.instance;
	arguments.callee.instance = this;

	var _interval 				= (interval||1),
		_timeUnit				= (timeUnit||Timer.TimeUnit.SECONDS),
		_iterationAmount		= 0,
		_startedAt				= new Date(),
		_millisecondsSinceStart	= 0,
		_minimumInterval		= 32 * Timer.TimeUnit.MILLISECONDS, // maximum of 31 times a second;
		_stopped 				= (!start||false)? true: false,
		_timeoutHook,
		_eventlist				= {},
		_now					= false,
		_planArray				= [];
		_log					= true;

	function setTimer(){
		if(isEmpty(_eventlist)){

			_timeoutHook = setTimeout(onTimer, _interval * _timeUnit);

		}else{

			_now = new Date().getTime();

			var next = Math.min.apply(null, _planArray),
				timeleft = next - _now;
				nextCheck = timeleft/2 > _minimumInterval ? timeleft/2 : _minimumInterval;

			_timeoutHook = setTimeout(onTimer, nextCheck);
		}
	}

	function onTimer(){
		_iterationAmount++;
		_millisecondsSinceStart = _startedAt.getTime() - new Date().getTime();
		fireEvents();

		if(!_stopped) setTimer();
	}

	function dateToOffset(date){
		return date.getTime() - _startedAt.getTime();
	}

	function deleteCompletedEvents(){
		for(var eventInstance in _eventlist){
			if((_eventlist[eventInstance].done)){
				delete _eventlist[eventInstance];
			}
		}
	}

	function updatePlanArray(){
		_planArray = [];
		for(var eventInstance in _eventlist){
			_planArray.push(_eventlist[eventInstance].plannedAt)
		}
	} 

	function fireEvents(date){
		_now = new Date().getTime();
		var _eventsFired = false;
		for(var eventInstance in _eventlist){
			if(checkIfTimeToFire(_eventlist[eventInstance], _now)){
				_eventlist[eventInstance].fire();
				_eventsFired = true;
			}
		}

		if(_eventsFired){
			deleteCompletedEvents();
			updatePlanArray();
		}
	}

	function checkIfTimeToFire(timeEvent, time){
		return timeEvent.plannedAt < time;
	}

	function log(timeEvent, time){
		return timeEvent.plannedAt < time;
	}
	function error(timeEvent, time){
		return timeEvent.plannedAt < time;
	}

	this.start = function(){
		setTimer();
		_stopped = false;
	};

	this.stop = function(){
		clearTimeout(_timeoutHook); 
		_stopped = true;
	};

	this.pause = function(){
		clearTimeout(_timeoutHook); 
		_stopped = true;
	};

	this.addEventAt = function(dateObject, handler, name, data){

		if (!isSet(handler, "function")){
			throw new Timer.TimerError("first param needs to be a function"); 
			return;
		}
		if (!isSet(dateObject) || !isSet(dateObject.getMonth, "function")){
			throw new Timer.TimerError("second param needs to be a javascript date object"); 
			return;
		}

		var _event = new Timer.TimerEvent(handler, data),
			_name = (name||"anonymous")
			
		_event.fireAt(dateObject);
		_event.name = _name;
		_eventlist[_name] = _event;

		updatePlanArray();
		if(!_stopped) setTimer();
	};

	this.repeatEventEvery = function(time, timeUnit, handler, name, data){

		if (!isSet(time, "number")){
			throw new Timer.TimerError("first param needs to be a number"); 
			return;
		}

		if (!isSet(handler, "function")){
			throw new Timer.TimerError("third param needs to be a function"); 
			return;
		}

		var _event = new Timer.TimerEvent(handler, data),
			_name = (name||"anonymous")
			
		_event.name = _name;
		_event.interval = time * (timeUnit||Timer.TimeUnit.SECONDS);
		_eventlist[_name] = _event;

		_event.fireIn(time , (timeUnit||Timer.TimeUnit.SECONDS));

		updatePlanArray();
		if(!_stopped) setTimer();

	};

	this.repeatEventBetween = function(start, stop, interval, intervalTimeUnit, handler, name, data){

		if (!isSet(handler, "function")){
			throw new Timer.TimerError("third param needs to be a function"); 
			return;
		}

		var _event = new Timer.TimerEvent(handler, data),
			_name = (name||"anonymous")
			
		_event.name = _name;
		_event.interval = interval * (intervalTimeUnit||Timer.TimeUnit.SECONDS);
		_eventlist[_name] = _event;

		if(isSet(start)){
			_event.fireAt(start);
		}else{
			_event.fireIn(time , (intervalTimeUnit||Timer.TimeUnit.SECONDS));
		}

		updatePlanArray();
		if(!_stopped) setTimer();

	};

	this.removeEvent = function(name){
		delete _eventlist[name];
	};

	this.getEvents = function(){
		return _eventlist;
	}

	if(!_stopped)setTimer();
}

Timer.TimerEvent = function(handler, data){

	var _handler	= (handler||function(){}),
		_start 		= false,
		_end 		= false,
		_timesFired	= 0,
		_data		= (data||{}),
		_self 		= this,
		_now;

	this.name	 	= "anonymous";
	this.plannedAt 	= false;
	this.interval 	= false;
	this.done	 	= false;

	function plan(){
		_now = new Date().getTime();
		var _startTime = _start ? _start.getTime(): _now;
		_self.plannedAt = _startTime > ( _now + _self.interval ) ? _startTime : ( _now + _self.interval );
	}

	this.setHandler = function(handler, data){
		_handler = handler;
		_data = data;
	}

	this.fire = function(){

		_now = new Date();
		
		//fire handler!
		returnData = _handler(_data, _timesFired);
		for (var attrname in returnData) { _data[attrname] = returnData[attrname]; }

		if(!this.interval || (_end != false && _now < _end) || _data.done == true){
			this.plannedAt = false;
			this.done = true;
		}else{
			plan();
		}

		_timesFired++;
	}

	this.span = function(startDateObject, stopDateObject){
		_start = (startDateObject||new Date());
		_end = (stopDateObject||false);
	}

	this.fireAt = function(dateObject){
		this.plannedAt = dateObject.getTime();
	}

	this.fireIn = function(time, timeUnit){
		this.plannedAt = new Date().getTime() + time * (timeUnit||Timer.TimeUnit.SECONDS);
	}

	this.setTimeSpan = function(start, end){
		_start = (start||false);
		_end = (end||false);
	}

	this.cancel = function(){
		this.plannedAt = false;
		this.done = true;
	}
}

Timer.TimerError = function(message){
	this.name = "TimerError";
	this.message = (message||"no message");
	
	var _dummy = { error : function(){alert("error")} },
		_console = (console||_dummy);

	_console.error(this.name +"::"+ this.message);

	return this.name +"::"+ this.message;
}

Timer.TimeUnit = {

	convert : function(value, timeUnit, toTimeUnit){
		return value*timeUnit/toUnit;
	},

	MILLISECONDS 	: 1,
	SECONDS 		: 1000,
	MINUTES 		: 60000,
	HOURS 	 		: 3600000,
	DAYS			: 86400000
}

function isSet(value, asType){
	var _isset = true;

	if (typeof(value) == "undefined"){
		_isset = false;
	}
	if (asType||false){
		if(typeof(value) != asType){
			_isset = false;
		}
	}

	return _isset;
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}