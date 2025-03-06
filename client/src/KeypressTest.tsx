import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function KeypressTest() {
  const [inputText, setInputText] = useState('');
  const [lastKeyInfo, setLastKeyInfo] = useState('No key pressed yet');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust height of textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleShiftEnter = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      // Insert newline
      const textBefore = inputText.substring(0, start);
      const textAfter = inputText.substring(end);
      const newText = textBefore + '\n' + textAfter;
      
      setInputText(newText);
      
      // Set cursor position after update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPosition = start + 1;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setLastKeyInfo(
      `Key: ${e.key}, Code: ${e.code}, ShiftKey: ${e.shiftKey}, 
      AltKey: ${e.altKey}, CtrlKey: ${e.ctrlKey}`
    );
    
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        handleShiftEnter();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const sendMessage = () => {
    alert(`Message sent: ${inputText}`);
    setInputText('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Keyboard Testing</h1>
      
      <div className="mb-4 p-4 bg-green-50 rounded">
        <p className="text-sm font-medium">Last Key Info:</p>
        <pre className="whitespace-pre-wrap text-xs">{lastKeyInfo}</pre>
      </div>
      
      <div className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex flex-col gap-3"
        >
          <div className="border rounded-md p-2">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type here... Press Shift+Enter for new line"
              className="resize-none min-h-[100px] w-full whitespace-pre-wrap"
              rows={3}
            />
          </div>
          
          <div className="flex justify-between">
            <div>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleShiftEnter}
              >
                Manual Insert Newline
              </Button>
            </div>
            
            <div>
              <Button 
                type="submit"
                disabled={!inputText.trim()}
              >
                Send Message
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Current Text Preview:</h2>
        <div className="bg-slate-100 p-4 rounded whitespace-pre-wrap">
          {inputText || '(empty)'}
        </div>
      </div>
    </div>
  );
}