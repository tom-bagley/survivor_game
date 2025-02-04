import { useContext, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

export default function Login() {
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
        const user = {
          email: responseData.email,
          name: responseData.name,
          portfolio: responseData.portfolio,
        };
        setUser(user);
        navigate('/dashboardpreseason');
        
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  return (
    <div className="login-container">
      <form onSubmit={loginUser} className="login-form">
        <label>Email</label>
        <input
          type="email"
          placeholder="enter email..."
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
        />
        <label>Password</label>
        <input
          type="password"
          placeholder="enter password..."
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
  
}

