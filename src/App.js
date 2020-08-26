import React, {useState, useEffect} from 'react';
import './App.css';
import {KEY} from './keyboard_code_enums';

const InputState = {
  Inputing: 0,
  Converting: 1
}

function useIMEState() {
  const [rawInput, setRawInput] = useState('');
  const [inputState, setInputState] = useState(InputState.Inputing);
  let candidates = ['東京', '東響', '問う京']
  const [candix, setCandix] = useState(0);
  // candixが変更されるときにこれで変えて
  // setRawInput(candidates[candix])

  useEffect(() =>{
    if(inputState == InputState.Converting) {
      setRawInput(candidates[candix])
    }
  }, [inputState, candix]);

  function onKey(e){
    let keyCode = e.keyCode;
    if(e.keyCode == KEY.BACKSPACE) {
      setRawInput(rawInput.substring(0, rawInput.length-1));
    }
    else if(e.keyCode == KEY.SPACE) {
      if(inputState == InputState.Inputing) {
        setInputState(InputState.Converting)
      }
      else if(inputState == InputState.Converting) {
        setCandix((candix+1) % candidates.length);
      }

    }
    else {
      setRawInput(rawInput + e.key);
    }
  }
  return [rawInput, inputState, candidates, candix, onKey];
}

function App() {
  const [mode, setMode] = useState(false);
  const [preEdit, inputState, candidates, candix, onKey] = useIMEState();

  return (
    <div className="App">
      <div>
        <button onClick={() => setMode(!mode)}>{mode ? 'on' : 'off'}</button>
      </div>
        <textarea className={mode ? "imeOn" : "imeOff"}
      onKeyDown={(e) => {onKey(e); e.preventDefault();}}>
      </textarea>
      <div>
        <input type="text" style={{textDecoration:"underline"}} value={preEdit} readOnly={true} />
      </div>
      {
        inputState == InputState.Converting &&  
        <ul>
          {candidates.map((item, i) =>
            <li key={item} className={i == candix ? "selecting" : ""}>{item}</li>
          )}
        </ul>
      }
    </div>

  );
}

export default App;
