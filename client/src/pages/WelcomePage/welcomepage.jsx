import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../context/userContext";
import axios from "axios";

export default function Welcome() {
    const { user, loading } = useContext(UserContext);
    console.log("Welcome: user =", user);
    console.log("Welcome: user.id =", user?.id);
    console.log("Welcome: user._id =", user?._id);

    if (loading) return <div>Loading...</div>;

    if (!user) return <div>You are not logged in.</div>;

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '2rem'
        }}>
            {user.name}!, {user.email}, {user.id}
        </div>

    )
}