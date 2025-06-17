import { useContext, useState } from "react";
import axios from 'axios';
import {toast} from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/userContext";
import './register.css';

export default function Register() {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate()
    const [data, setData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const registerUser = async (e) => {
    e.preventDefault()
    const {name, email, password} = data
    try {
      const {data} = await axios.post('/auth/register', {
        name, email, password
      })
      if(data.error) {
        toast.error(data.error)
      } else {
        toast.success('Register Successful. Welcome!')
        const profileRes = await axios.get("/auth/profile");
        const user = profileRes.data;
        setUser(user);
        navigate('/dashboard')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <form onSubmit={registerUser} className="register-form">
      <div className="register-container">
        <h2>Register</h2>

        <label>Name</label>
        <input
          type="text"
          placeholder="enter name..."
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
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
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}
