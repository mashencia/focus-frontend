import { useState, useEffect } from "react"; //this is how the component stores memory (consistent values between renders)
import {api} from "./api"; //wraps fetch() and commmunicates with the backend


//helper method for the stopwatch time display
function timeFormat(ElapsedSeconds){
  //Needs to pe displayed {hh:mm:ss}
  const hour = Math.floor(ElapsedSeconds/3600);
  const minutes = Math.floor((ElapsedSeconds % 3600)/60);
  const seconds = Math.floor(ElapsedSeconds%60);

  //adding a pad (0) for the first digit in case needed
  const pad = (n)=> n.toString().padStart(2, "0");

  //returning the formatted stopwatch
  return `${pad(hour)}:${pad(minutes)}:${pad(seconds)}`;

}

//helper method to the history session time display
//Solves the problem of C# returning TimeSpan values.toString()
//meaning that it is displayed with days and decimals after the seconds
function formatTimeSpan(timeSpan){
  //in case the session was not terminated (handles null values)
  if(!timeSpan) return "00:00:00";

  //value -> string
  const span = timeSpan.toString();

  let days = 0;
  let timePart = span;

  //getting the days number which is the digit before the first dot
  const dayMatch = span.match(/^(\d+)\.(\d{2}:\d{2}:\d{2})/);

  if (dayMatch) {
    //extracts the number of days from the string
    days = parseInt(dayMatch[1], 10);

    //extracats the timespan after the days
    timePart = span.substring(span.indexOf(".") + 1);
  }

  //removes the decimals after the seconds
  const noDecimalTime = timePart.split(".")[0];

  //formats into {hh:mm:ss}
  const [hh, mm, ss] = noDecimalTime.split(":").map(Number);

  //calculating teh total number of hours from days + current running hours
  const totalHours = days*24 + (hh||0);

  //padding for the zeroes 
  const pad = (n)=> String(n).padStart(2,"0");

  //returning the time span habitual to the user
  return `${pad(totalHours)}:${pad(mm || 0)}:${pad(ss || 0)}`;

}


//Main React component 
export default function App(){
  //current design permits only one user
  //for testing purposes
  //Later could come from login and authorization
  const userId = 1; 

  //React state variables (useState hook)

  //active: updated by setActive - focus session currently running
  const [active, setActive]=useState(false);

  //break: updated by setBreak, meaning the user is on break\
  const [ONbreak, setBreak]=useState(false);

  //history: section displaying past session data
  const [history, setHistory]=useState([]);
  const [historyLoading, setHistoryLoading]=useState(false);

  //loading: api request in progress (disables buttons and shows feedback)
  const [loading, setLoading]=useState(false);

  //error: storage of backend/network error messages
  const [error, setError]=useState(null);

  //stopwatch: only accounts for the time in focus excluding breaks
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  //user clicks "Start Focus":
  async function startFocus(){
    try{

      //Notifies React to load (trigger for re-render)
      setLoading(true);

      //Previous error messages cleared
      setError(null);

      //resetting the stop watch to 0 (marks the start of a new session)
      setStopwatchSeconds(0);

      //POST  req to the backend
      const res = await api(`/api/focus/start/${userId}`, {method: "POST"});
      console.log("Start focus response:", res); //for debug

      //Marks the sessions as active for the UI (state)
      setActive(true);

    }catch(err){
      //backend/fetch errors
      //api() helper allows for the err.message
      setError(err.message);
    }finally{
      //stoppin the loading visual 
      setLoading(false);
    }
  }

  //user click "Start break"
  async function startBreak(){
    try{
      //Notifies React to load (trigger for re-render)
      setLoading(true);

      //Previous error messages cleared
      setError(null);

      //POST req to the backend
      const res = await api(`/api/focus/break/start/${userId}`, {method: "POST",});
      console.log("Break session commenced");

      //Marks the break session state active
      setBreak(true);
    
    }catch(err){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  //user clicks "End Break"
async function endBreak(){
    try{
      //Notifies React to load (trigger for re-render)
      setLoading(true);

      //Previous error messages cleared
      setError(null);

      //POST req to the backend
      const res = await api(`/api/focus/break/end/${userId}`, {method: "POST",});
      console.log("Break session ended");

      //Marks the break session state active
      setBreak(false);
    
    }catch(err){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  //user clicks "End Focus"
  async function endFocus(){
    try{

      //Notifies React to load (trigger for re-render)
      setLoading(true);

      //Previous error messages cleared
      setError(null);


      //POST  req to the backend
      const res = await api(`/api/focus/end/${userId}`, {method: "POST"});
      console.log("End focus response:", res); //for debug

      ///final state
      setActive(false);
      setBreak(false);

      //History is loaded if API was successful
      //refreshing the history since the session has ended
      await loadHistory();
      
    }catch(err){
      //backend/fetch errors
      //api() helper allows for the err.message
      setError(err.message);
    }finally{
      //stoppin the loading visual 
      setLoading(false);
    }
    

  }


  //loading history
  async function loadHistory(){
    try{
      setHistoryLoading(true);
      setError(null);

      const data = await api(`/api/focus/history/${userId}`, {method: "GET"});
      console.log("History data:", data);
      setHistory(data ?? []);


    }catch(err){
      setError(err.message);
    }finally{
      setHistoryLoading(false);
    }
  }
  
  //Stopwacth: ticking only when focus session is running (not break)
  useEffect(() => {
      if(!active||ONbreak){
        return;
      }

      const interval = setInterval(()=>{
        setStopwatchSeconds((s)=> s+1);
      }, 1000);

      //The interval is stopped once focus session is stopped (active changes)
      //or when a break session begins (ONbreak changes)
      return()=> clearInterval(interval);
  }, [active, ONbreak]);




  //JSX - UI
  return(
    <div className="min-h-screen bg-slate-800 text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/*Header*/}
        <div className="mb-8">
          <h1 className="text-6xl font-bold tracking-tight">Focus</h1>
          <p className="mt-2 text-slate-400">Track your focus and rest, to reflect and improve.</p>
        </div>

        {/*Body*/}
        <div className="rounded-2xl border border-slate-600 bg-slate-800/60 p-6 shadow-lg">
          {/*Session Status*/}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                active ? "bg-sky-300" : "bg-slate-500"
              }`}
            />
            <div className="text-sm">
              {active ? (
                <span className="text-slate-100">
                  Session running{" "}
                  {ONbreak && <span className="text-emerald-400">(on break)</span>}
                </span>
              ) : (
                <span className="text-slate-300">No active session</span>
              )}
            </div>
          </div>
              {/*Stopwatch*/}
              {active &&(
              <div className="rounded-xl border border-slate-600 bg-slate-800/40 px-4 py-2 font-mono text-lg">
              {timeFormat(stopwatchSeconds)}
              {ONbreak && " (paused on break)"}
            </div>
             )}
        </div>
        {/*Buttons*/}
        <div className="mt-6 flex flex-wrap gap-3">
          {/*Start Focus Button*/}
          <button onClick={startFocus} disabled={loading||active} className="rounded-xl bg-sky-300 px-4 py-2 font-medium text-slate-900 shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Starting":"Start Focus"}
          </button>

          {/*Start Break Button*/}
          {active && !ONbreak && (
          <button onClick={startBreak} disabled={loading} className="rounded-xl bg-violet-400 px-4 py-2 font-medium text-slate-900 shadow hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50">
            Start Break
          </button>
          )}

          {/*End Break Button*/}
          {active && ONbreak &&(
          <button onClick={endBreak} disabled={loading} className="rounded-xl bg-violet-400 px-4 py-2 font-medium text-slate-900 shadow hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50">
            End Break
          </button>
          )}

          {/*End Focus Button*/}
          <button onClick={endFocus} disabled={loading||!active} className="rounded-xl bg-slate-200 px-4 py-2 font-medium text-slate-900 shadow hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Ending":"End Focus"}
          </button>

        </div> {/*Buttons*/}
        
        {/*Error Message*/}
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
      </div> {/*Body*/}

      {/*History*/}
      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Session History</h2>
          {/*Button to Refresh the History*/}
          <button onClick={loadHistory} disabled={historyLoading} className="w-fit rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-950/70 disabled:cursor-not-allowed disabled:opacity-50">
            {historyLoading?"Loading":"Refresh History"}
         </button>
        </div>

        {/*Display in case the user first time uses the app*/}
        {history.length === 0 ? (
        <p className="mt-4 text-slate-300">No completed sessions yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto"> 
          <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-slate-300">
              <th className="py-2 pr-4">Session</th>
              <th className="py-2 pr-4">Start Time</th>
              <th className="py-2 pr-4">End Time</th>
              <th className="py-2 pr-4">Focus Duration</th>
              <th className="py-2 pr-4">Break Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {history.map((h) => (
              <tr key={h.sessionId} className="text-slate-100">
                <td className="py-3 pr-4 text-slate-200">{h.sessionId}</td>
                <td className="py-3 pr-4 text-slate-300">{new Date(h.startTime).toLocaleString()}</td>
                <td className="py-3 pr-4 text-slate-300">
                  {h.endTime ? new Date(h.endTime).toLocaleString() : "-"}
                </td>
                <td className="py-3 pr-4 font-mono">{formatTimeSpan(h.focusTime)}</td>
                <td className="py-3 pr-0 font-mono">{formatTimeSpan(h.breakTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      </div>
  </div>
  </div>
);}
