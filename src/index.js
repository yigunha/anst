import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';  // 기본 스타일 (필요에 따라 변경 가능)
import App from './App';  // 기본 App 컴포넌트
// import reportWebVitals from './reportWebVitals';  // 성능 측정을 위한 파일 (필요에 따라 삭제 가능)

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// 성능 측정을 위한 코드 (필요 시 삭제 가능)
reportWebVitals();
