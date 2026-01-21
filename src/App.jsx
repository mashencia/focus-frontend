import {useState} from "react"; //this is how the component stores memory (consistent values between renders)
import {api} from "./api"; //wraps fetch() and commmunicates with the backend


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



  //user clicks "Start Focus":
  async function startFocus(){
    try{

      //Notifies React to load (trigger for re-render)
      setLoading(true);

      //Previous error messages cleared
      setError(null);


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
      console.log("Break session commenced");

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
    //final state
    setActive(false);
    setBreak(false);
    //refreshing the history since the session has ended
    await loadHistory();

  }


  //loading history
  async function loadHistory(){
    try{
      setHistoryLoading(true);
      setError(null);

      const data = await api(`/api/focus/history/${userId}`, {method: "GET"});
      setHistory(data ?? []);


    }catch(err){
      setError(err.message);
    }finally{
      setHistoryLoading(false);
    }
  }


  //JSX - UI
  return(
    <div style={{padding:20, fontFamily:"Arial"}}>
      <h1>Focus</h1>

      {/*Start Focus Button*/}
      <button onClick={startFocus} disabledled={loading||active}>
        {loading ? "Starting":"Start Focus"}
      </button>

      {/*Start Break Button*/}
      {active && !ONbreak && (
        <button onClick={startBreak} disabledled={loading}>
          Start Break
        </button>
      )}

      {/*End Break Button*/}
      {active && ONbreak &&(
        <button onClick={endBreak} disabledled={loading}>
          End Break
        </button>
      )}
      {/*End Focus Button*/}
      <button onClick={endFocus} disabledled={loading||!active} style={{marginLeft:10}}>
        {loading ? "Ending":"End Focus"}
      </button>
      {active && <p> Focus session is running</p>}
      {!active && <p> No running focus sessions</p>}

      {error && <p style={{color: "red"}}>{error}</p>}

      {/*History Section*/}
      <hr style={{ margin: "20 px 0"}} />

      <div>
        <h2>Session History</h2>

        <button onclick={loadingHist} disabled={historyLoading}>
          {historyLoading?"Loading":"Refresh History"}
        </button>
        {history.length === 0 ? (
        <p>No completed sessions yet.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ marginTop: 10, borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Session</th>
              <th>Start</th>
              <th>End</th>
              <th>Focus Time</th>
              <th>Break Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.sessionId}>
                <td>{h.sessionId}</td>
                <td>{new Date(h.startTime).toLocaleString()}</td>
                <td>
                  {h.endTime
                    ? new Date(h.endTime).toLocaleString()
                    : "-"}
                </td>
                <td>{h.focusTime}</td>
                <td>{h.breakTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>

    
  );
}
