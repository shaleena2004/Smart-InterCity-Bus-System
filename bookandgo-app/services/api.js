import axios from 'axios';

// ඔයාගේ පරිගණකයේ IP Address එක සහ Backend එක run වෙන Port එක මෙතන දෙන්න.
// (Localhost වෙනුවට IP එකම දෙන්න ඕනේ, නැත්නම් ෆෝන් එකෙන් app එක බලද්දී connect වෙන්නේ නෑ)
const API_BASE_URL = 'http://192.168.8.139:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        // ඉස්සරහට token එහෙම යවන්න ඕනෙ නම් ඒවත් මෙතනට එකතු කරන්න පුළුවන්
    },
});

export default api;