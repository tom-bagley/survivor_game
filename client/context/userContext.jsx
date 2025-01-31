import axios from 'axios';
import { createContext, useEffect, useState } from 'react';

export const UserContext = createContext({})

export function UserContextProvider({children}) {
const [user, setUser] = useState(null);
useEffect(() => {
    const fetchUser = async () => {
        if (!user) {
            try {
                const { data } = await axios.get('/profile');
                setUser(data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        }
    };

    fetchUser();
}, []);

    return (
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    )
}
