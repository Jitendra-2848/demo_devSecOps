import { useEffect } from 'react';
import toast from 'react-hot-toast';

useEffect(() => {
    if (!error) {
        return;
    }
    toast.error(error);
    setError("");
}, [error]) 
