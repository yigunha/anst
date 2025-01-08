import React, { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태
  const [username, setUsername] = useState(''); // 입력된 ID
  const [password, setPassword] = useState(''); // 입력된 PW
  const [error, setError] = useState(''); // 에러 메시지

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://linkdoor-production.up.railway.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsLoggedIn(true); // 로그인 성공
        setError('');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  if (isLoggedIn) {
    return (
      <div className="App">
        <h1>Welcome, {username}!</h1>
        <p>You are logged in.</p>
        {/* 여기서 관리자 권한으로 추가 기능 구현 가능 */}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>ID: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default App;
