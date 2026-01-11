// import http from "k6/http";
// import { sleep } from "k6";

// export let options = {
    // stages: [
    //     { duration: '1m', target: 3000 },
    //     // { duration: '1m', target: 10000 },
    //     // { duration: '1m', target: 15000 },
    //     // { duration: '1m', target: 20000 },
    // ]


//     stages: [
//         { duration: '1m', target: 2500 },
//         { duration: '1m', target: 5000 },
//         { duration: '1m', target: 7500 },
//         { duration: '1m', target: 10000 },
//     ]
// };


// const headersStudent = {
//     "Content-Type": "application/json",
//     Authorization:
//         "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2wiOiJzdHVkZW50IiwidXNlcklkIjoiNjkzOWYxMjA2YzM2MmYwOTdjNmUyMjgwIiwiZW1haWwiOiJodXNzaWVuYW1nYWQxMjNAZ21haWwuY29tIiwibmFtZSI6Ikh1c3NpZW4gQWJvb3VmIiwicGhvbmUiOiIwMTIwMTY3MDIzOSIsImlhdCI6MTc2Nzg4Mzg4MX0.MZ4y1F24RemgpY325wKgqM4ixS1JplTEOnzDBYvVV-I",
// };

// function checkResponse(res, endpoint) {
//     if (res.status !== 200) {
//         console.log(`❌ Failed request: ${endpoint}`);
//         console.log(`   Status: ${res.status}`);
//         console.log(`   Body: ${res.body}`);
//     } else {
//         console.log(`✅ Success: ${endpoint}`);
//     }
// }

// export default function () {
//     let res;

    // res = http.get("http://localhost:5000/student/exam/1/3/1767344892898", { headers: headersStudent });
    // checkResponse(res, "/student/student/exam");

    // res = http.get("http://localhost:5000/student/profile", { headers: headersStudent });
    // checkResponse(res, "/student/profile");

    // res = http.post(
    //     "http://localhost:5000/student/get_views",
    //     JSON.stringify({
    //         userId: "6939f1206c362f097c6e2280",
    //         courseId: 1,
    //         sectionId: 3,
    //         sectionableId: 1,
    //     }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/student/get_views");

    // res = http.post(
    //     "http://localhost:5000/student/transactions",
    //     JSON.stringify({
    //         token: headersStudent.Authorization.split(" ")[1],
    //     }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/student/transactions");

    // res = http.post(
    //     "http://localhost:5000/student/loginemail",
    //     JSON.stringify({ email: "hussienamgad123@gmail.com", password: "Hussien@27071977#" }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/student/loginemail");

    // res = http.post(
    //     "http://localhost:5000/student/loginphone",
    //     JSON.stringify({ phone: "01201670239", password: "Hussien@27071977#" }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/student/loginphone");

    // res = http.post("http://localhost:5000/course/get_course/1",
    //     JSON.stringify({
    //         userId: "6939f1206c362f097c6e2280",
    //     }),
    //     { headers: { "Content-Type": "application/json" } });
    // checkResponse(res, "/course/get_course");

    // res = http.get("http://localhost:5000/course/get_all_courses", { headers: { "Content-Type": "application/json" } });
    // checkResponse(res, "/course/get_all_courses");

    // res = http.get("http://localhost:5000/course/courses/1", { headers: { "Content-Type": "application/json" } });
    // checkResponse(res, "/course/courses");
    // res = http.get("https://server-platform-hussien.freeddns.org/test", { headers: { "Content-Type": "application/json" } });
    // checkResponse(res, "/test");

    // res = http.post(
    //     "http://localhost:5000/auth/check-access-course",
    //     JSON.stringify({ token: headersStudent.Authorization.split(" ")[1], courseId: 1 }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/auth/check-access-course");

    // res = http.post(
    //     "http://localhost:5000/auth/verify-token",
    //     JSON.stringify({ token: headersStudent.Authorization.split(" ")[1] }),
    //     { headers: { "Content-Type": "application/json" } }
    // );
    // checkResponse(res, "/auth/verify-token");

    // res = http.get("http://localhost:5000/checkout", { headers: { "Content-Type": "application/json" } });
    // checkResponse(res, "/checkout");

//     sleep(0.01); // بدل 1s
// }

// server {
//     server_name server-platform-hussien.freeddns.org;

//     location / {
//         proxy_pass http://localhost:4000;
//         proxy_http_version 1.1;
//         proxy_set_header Upgrade $http_upgrade;
//         proxy_set_header Connection 'upgrade';
//         proxy_set_header Host $host;
//         proxy_cache_bypass $http_upgrade;
//         proxy_read_timeout 65s;
//         proxy_send_timeout 65s;
//     }

// listen[::]: 443 ssl; # managed by Certbot
//     listen 443 ssl; # managed by Certbot
// ssl_certificate / etc / letsencrypt / live / server - platform - hussien.freeddns.org / fullchain.pem; # managed by Certbot
// ssl_certificate_key / etc / letsencrypt / live / server - platform - hussien.freeddns.org / privkey.pem; # managed by Certbot
// include / etc / letsencrypt / options - ssl - nginx.conf; # managed by Certbot
// ssl_dhparam / etc / letsencrypt / ssl - dhparams.pem; # managed by Certbot

// }
// server {
//     if ($host = server - platform - hussien.freeddns.org) {
//         return 301 https://$host$request_uri;
//     } # managed by Certbot


//     listen 80;
//     listen[::]: 80;
//     server_name server - platform - hussien.freeddns.org;
//     return 404; # managed by Certbot


// }


import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// تعريف metrics جديدة للـ latency
let latencyTrend = new Trend("latency_trend", true);

export let options = {
    stages: [
        // { duration: "1m", target: 1000 },    // Start gradual ramp-up
        // { duration: "1m", target: 2500 },
        { duration: "1m", target: 5000 },
        // { duration: "1m", target: 7500 },
        // { duration: "2m", target: 10000 },  
        // { duration: "2m", target: 0 },       // ramp-down
    ],
    thresholds: {
        "http_req_duration": ["p(95)<5000"], // 95% من requests < 5s
        "http_req_failed": ["rate<0.05"],    // أقل من 5% failed requests
    },
};

export default function () {
    let res = http.get("https://server-platform-hussien.freeddns.org/test", {
        headers: { "Content-Type": "application/json" },
        timeout: "60s",  // بدل default
    });

    // Save latency
    latencyTrend.add(res.timings.duration);

    check(res, {
        "status is 200": (r) => r.status === 200,
    });

    sleep(0.01); // تقليل زمن الانتظار بين requests
}
