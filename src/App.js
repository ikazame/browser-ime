import React, {useState, useEffect, createRef} from 'react';
import './App.css';
import {KEY} from './keyboard_code_enums';
import { toKana } from 'wanakana';

const InputState = {
  Waiting: 0,
  Inputing: 1,
  Converting: 2
}

function useIMEState(preEditRef, addText) {
  const [rawInput, setRawInput] = useState('');
  const [inputState, setInputState] = useState(InputState.Waiting);
  // let candidates = ['東京', '東響', '問う京']
  const [candidates, setCandidates] = useState([])
  const [candix, setCandix] = useState(0);
  // candixが変更されるときにこれで変えて
  // setRawInput(candidates[candix])

  useEffect(() =>{
    if(inputState === InputState.Converting) {
      setRawInput(candidates[candix])
      // 非同期通信がいつ終わるかわからないので、ここでは面倒見れない
    }
  }, [candix]);

  useEffect(() => {
    if(inputState === InputState.Inputing){
      preEditRef.current.focus();
      // document.getSelection().collapse(preEditRef.current, 1)
      // preEditRef.current.setSelectionRange(1, 1);
      console.log("focused")
    } 
  }, [inputState])

  function onKey(e){
    let keyCode = e.keyCode;
    if (inputState === InputState.Waiting) {
      // command/ctrlが同時押しされているときもreturnでいい
      if(!((48 <= e.keyCode && e.keyCode <= 90) || (186 <= e.keyCode && e.keyCode <= 191)
    || (219 <= e.keyCode && e.keyCode <= 222))) 
        // 新規の文字追加入力でなければ、onChangeに任せる(カーソル移動など)
        return;
      if(e.ctrlKey) return;
    }
    if(e.keyCode === KEY.BACKSPACE && inputState !== InputState.Converting) {
      setRawInput(rawInput.substring(0, rawInput.length-1));
    }
    else if(e.keyCode === KEY.SPACE) {
      if(inputState === InputState.Inputing) {
        if(false){
          // mock
          let results = ['東京', '東響', '問う京']
          setInputState(InputState.Converting)
          setCandidates(results);
          setRawInput(results[0]);
          setCandix(0)
        }
        else{
          const obj = {input: rawInput};
          const method = "POST";
          const body = JSON.stringify(obj);
          const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          };
          fetch("http://localhost:5000", {method, headers, body})
          .then((res) => res.text()
          .then((text) => {
            let results = JSON.parse(text);
            setInputState(InputState.Converting)
            setCandidates(results);
            setRawInput(results[0]);
            setCandix(0)
          }));
        }
      }
      else if(inputState === InputState.Converting) {
        setCandix((candix+1) % candidates.length);
      }
    }
    else if(e.keyCode === KEY.DOWN_ARROW && inputState === InputState.Converting) {
      setCandix((candix+1) % candidates.length);
    }
    else if(e.keyCode === KEY.UP_ARROW&& inputState === InputState.Converting) {
      setCandix((candix-1+candidates.length) % candidates.length);
    }
    else if(e.keyCode === KEY.ENTER) {
      if(inputState === InputState.Inputing){
        addText(rawInput)
      }
      else if(inputState === InputState.Converting){
        addText(candidates[candix])
      }
      setRawInput('')
      setInputState(InputState.Waiting);
    }
    else if((48 <= e.keyCode && e.keyCode <= 90) || (186 <= e.keyCode && e.keyCode <= 191)
    || (219 <= e.keyCode && e.keyCode <= 222)) {
      if(inputState !== InputState.Converting){
        if(inputState === InputState.Waiting){
          setInputState(InputState.Inputing)
        }
        // nをすぐ"ん"にしようとするので、その対策
        if(e.keyCode === KEY.KEY_N &&  rawInput[rawInput.length-1] !== 'n')
          setRawInput(rawInput + e.key);
        else if(e.keyCode === KEY.KEY_Y && rawInput[rawInput.length-1] === 'n')
          setRawInput(rawInput + e.key);
        else
          setRawInput(toKana(rawInput + e.key));
      }
    }
    else if(e.keyCode === KEY.LEFT_ARROW || e.keyCode === KEY.RIGHT_ARROW){
      // preventDefaultさせたくない。でもこの書き方はdirty
      return;
    }
    e.preventDefault();
  }
  return [rawInput, setRawInput, inputState, candidates, candix, onKey];
}

function useTextarea(_textareaRef) {
  const [text, setText] = useState('');
  const textareaRef = _textareaRef;
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

    // textareaRef.current.selectionStart = 0
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

// event.target.valueにテキストエリアを変更したあとの値が入るなんて知らなかったのだな