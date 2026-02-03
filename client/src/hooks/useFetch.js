import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            };

            const response = await axios.get(`${API_URL}${url}`, { headers });
            setData(response.data);
        } catch (err) {
            console.error(`Error fetching ${url}:`, err);
            const message = err.response?.data?.message || 'Failed to fetch data';
            setError(message);
            // Only show toast for critical errors, not 404s if handled by UI
            if (options.showToast !== false) {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (options.immediate !== false) {
            fetchData();
        }
    }, [fetchData]);

    const refetch = () => fetchData();

    return { data, loading, error, refetch, setData };
};

export default useFetch;
