import React, {useState, useEffect, createRef} from 'react';
import './App.css';
import {KEY} from './keyboard_code_enums';
import { toKana } from 'wanakana';

const InputState = {
  Waiting: 0,
  Inputing: 1,
  Converting: 2
}

function useIMEState(addText) {
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

  function onKey(e){
    let keyCode = e.keyCode;
    if (inputState === InputState.Waiting) {
      // command/ctrlが同時押しされているときもreturnでいい
      if(!((48 <= e.keyCode && e.keyCode <= 90) || (186 <= e.keyCode && e.keyCode <= 191)
    || (219 <= e.keyCode && e.keyCode <= 222))) 
        // 新規の文字追加入力でなければ、onChangeに任せる(カーソル移動など)
        return;
    }
    if(e.keyCode === KEY.BACKSPACE) {
      setRawInput(rawInput.substring(0, rawInput.length-1));
    }
    else if(e.keyCode === KEY.SPACE) {
      if(inputState === InputState.Inputing) {
        setInputState(InputState.Converting)
        // mock
        // setCandidates(['東京', '東響', '問う京'])

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
          setCandidates(results);
          setRawInput(results[0]);
          setCandix(0)
        }));
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
      setInputState(InputState.Inputing)
      // nをすぐ"ん"にしようとするので、その対策
      if(e.keyCode === KEY.KEY_N)
        setRawInput(rawInput + e.key);
      else
        setRawInput(toKana(rawInput + e.key));
    }
    e.preventDefault();
  }
  return [rawInput, inputState, candidates, candix, onKey];
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
    // https://qiita.com/noraworld/items/d6334a4f9b07792200a5
    let pos = textareaRef.current.selectionStart
    setText(text.substr(0, pos) + subtext + text.substr(pos, text.length))
    setCursor(pos+subtext.length)

    // textareaRef.current.selectionStart = 0
  }

  return [text, addText, setText];
}

function App() {
  const [mode, setMode] = useState(false);
  const textareaRef = createRef()
  const [text, addText, setText] = useTextarea(textareaRef);
  const [preEdit, inputState, candidates, candix, onKey] = useIMEState(addText);

  return (
    <div className="App">
      <div>
        <button onClick={() => setMode(!mode)}>{mode ? 'on' : 'off'}</button>
      </div>
        <textarea className={mode ? "imeOn" : "imeOff"}
      onKeyDown={(e) => {if(mode) onKey(e);}} onChange={(e) => {setText(e.target.value)}} value={text} ref={textareaRef}>
      </textarea>
      <div>
        <input type="text" style={{textDecoration:"underline"}} value={preEdit} readOnly={true} id={"preEdit"} />
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