import express from "express";
import { formPost, rootGet } from "./controllers/root";
import cookieParser from "cookie-parser";
import { callbackController } from "./controllers/callback";
import { logoutController } from "./controllers/logout";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const port = 3001;

app.get("/", rootGet);
app.post("/oidc/auth", formPost);
app.get("/callback", callbackController);
app.post("/logout", logoutController);
app.get("/signed-out", (req, res) => {
  res.send(` 
    <head>
        <title>Signed out</title>
    </head>
    <body> 
        <h1>You've been signed out</h1>
        <h2>This is a custom sign out page!</h2>
    </body>
`);
});

app.listen(port);
