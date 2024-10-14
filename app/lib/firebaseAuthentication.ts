import firebase from 'firebase/compat/app';

async function handleAuthentication(user: firebase.User): Promise<boolean> {
  try {
    const token = await user.getIdToken();
      
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'login' })
    });

    if (!response.ok) {
      throw new Error('서버 인증 실패');
    }

    console.log('서버 인증 성공');
    return true;
  } catch (error) {
    console.error('인증 처리 중 오류 발생:', error);
    return false;
  }
}

export default handleAuthentication;