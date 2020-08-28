import React, {useState, useEffect, createRef} from 'react';
import './App.css';
import {KEY} from './keyboard_code_enums';
import { toKana } from 'wanakana';

const InputState = {
  Waiting: 0,
  Inputing: 1,
  Converting: 2
}

function isNormalKey(keyCode) {
  return (48 <= keyCode && keyCode <= 90) || (186 <= keyCode && keyCode <= 191)
    || (219 <= keyCode && keyCode <= 222)
}

function useIMEState(preEditRef, addText) {
  const [preEdit, setPreEdit] = useState('');
  const [inputState, setInputState] = useState(InputState.Waiting);
  const [candidates, setCandidates] = useState([])
  const [candix, setCandix] = useState(0);

  useEffect(() =>{
    if(inputState === InputState.Converting) {
      setPreEdit(candidates[candix])
    }
  }, [candix]);

  useEffect(() => {
    if(inputState === InputState.Inputing){
      preEditRef.current.focus();
    } 
  }, [inputState])

  function onKey(e){
    if (inputState === InputState.Waiting && e.ctrlKey){
      return;
    }
    else if(e.keyCode === KEY.BACKSPACE && inputState === InputState.Converting) {
      e.preventDefault()
    }
    else if(e.keyCode === KEY.SPACE) {
      if(inputState === InputState.Inputing) {
        const obj = {input: preEdit};
        const method = "POST";
        const body = JSON.stringify(obj);
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
        // fetch("http://localhost:5000", {method, headers, body})
        fetch("results.json", {headers})
        .then((res) => res.text()
        .then((text) => {
          console.log(text)
          let results = JSON.parse(text);
          setInputState(InputState.Converting)
          setCandidates(results);
          setPreEdit(results[0]);
          setCandix(0)
        }));
      }
      else if(inputState === InputState.Converting) {
        setCandix((candix+1) % candidates.length);
      }
      e.preventDefault();
    }
    else if(e.keyCode === KEY.DOWN_ARROW && inputState === InputState.Converting) {
      setCandix((candix+1) % candidates.length);
      e.preventDefault();
    }
    else if(e.keyCode === KEY.UP_ARROW&& inputState === InputState.Converting) {
      setCandix((candix-1+candidates.length) % candidates.length);
      e.preventDefault();
    }
    else if(e.keyCode === KEY.ENTER && inputState !== InputState.Waiting) {
      addText(preEdit)
      setPreEdit('')
      setInputState(InputState.Waiting);
      e.preventDefault();
    }
    else if(isNormalKey(e.keyCode)) {
      if(inputState === InputState.Waiting){
        setInputState(InputState.Inputing)
      }
      // nをすぐ"ん"にしようとするので、その対策
      if(e.keyCode === KEY.KEY_N &&  preEdit[preEdit.length-1] !== 'n')
        setPreEdit(preEdit + e.key);
      else if(e.keyCode === KEY.KEY_Y && preEdit[preEdit.length-1] === 'n')
        setPreEdit(preEdit + e.key);
      else
        setPreEdit(toKana(preEdit + e.key,  { customKanaMapping: {'nn': 'ん'}}));
    
      e.preventDefault();
    }
  }
  return [preEdit, setPreEdit, inputState, candidates, candix, onKey];
}

function useTextarea(textareaRef) {
  const [text, setText] = useState('');
  // 実際のカーソル位置と完全に同期しているわけではないので注意
  // 設定直後のみ値とカーソル位置が同一になることが保証される
  const [cursor, setCursor] = useState(0)

  useEffect(() =>{
    textareaRef.current.selectionStart = cursor
    textareaRef.current.selectionEnd = cursor
  }, [cursor]);

  function addText(subtext) {
    textareaRef.current.focus()
    // https://qiita.com/noraworld/items/d6334a4f9b07792200a5
    let pos = textareaRef.current.selectionStart
    setText(text.substr(0, pos) + subtext + text.substr(pos, text.length))
    setCursor(pos+subtext.length)
  }

  function saveCursorPos() {
    let pos = textareaRef.current.selectionStart
    setCursor(pos)
  }

  return [text, setText, addText,saveCursorPos];
}

function App() {
  const [mode, setMode] = useState(true);
  const textareaRef = createRef()
  const [text, setText, addText, saveCursorPos] = useTextarea(textareaRef);
  const preEditRef = createRef()
  const [preEdit, setPreEdit, inputState, candidates, candix, onKey] = useIMEState(preEditRef, addText);

  return (
    <div className="App">
      <div>
        <button onClick={() => setMode(!mode)}>{mode ? 'on' : 'off'}</button>
      </div>
        <textarea className={mode ? "imeOn" : "imeOff"}
      onKeyDown={(e) => {if(mode) onKey(e);}} onChange={(e) => {setText(e.target.value)}} onBlur={(e) => saveCursorPos() }value={text} ref={textareaRef}>
      </textarea>
      <div>
        <input type="text" style={{textDecoration:"underline"}} onKeyDown={(e) => {if(mode) onKey(e);}}  onChange={(e) => {setPreEdit(e.target.value)}} value={preEdit} id={"preEdit"} ref={preEditRef} />
      </div>
      {
        inputState === InputState.Converting &&  
        <ul>
          {candidates.map((item, i) =>
            <li key={item} className={i === candix ? "selecting" : ""}>{item}</li>
          )}
        </ul>
      }
    </div>
  );
}

export default App;
