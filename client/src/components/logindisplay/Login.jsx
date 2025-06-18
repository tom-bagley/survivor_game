import { useContext, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import './Login.css';

const Login = () => {
  const { setUser } = useContext(UserContext); 
  const navigate = useNavigate()
  const [data, setData] = useState({
    email: '',
    password: ''
  })

  const loginUser = async (e) => {
    e.preventDefault()
    const {email, password} = data
    try { 
      const response = await axios.post('/auth/login', {
        email,
        password
      });
      const { data: responseData } = response; 
      if(responseData.error) {
        toast.error(data.error)
      }
      else {
        const profileRes = await axios.get("/auth/profile");
        const user = profileRes.data;
        console.log(user);
        setUser(user);
        navigate('/dashboard');
        
      }
    } catch (error) {
      console.log(error)
    }
  };
  
  return (
  <form onSubmit={loginUser} className="login-form">
    <div className="login-container">
      <h2>Login</h2>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        placeholder="Enter your email"
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={data.password}
        onChange={(e) => setData({ ...data, password: e.target.value })}
      />

      <button type="submit">Login</button>

      <div className="forgot-password">
        <span>
          Forgot <a href="#">password?</a>
        </span>
      </div>

      <div className="register-link">
        <span>
          New to the game? <a href="/register">Register here</a>
        </span>
      </div>
    </div>
  </form>
);


  
};

export default Login;