const { response } = require("express");
const http = require("http");
const app = require("express")();
app.get("/", (req,res)=>res.sendFile(__dirname+"/index.html"));

app.listen(9091, ()=>console.log("Listening on 9091"));
const webSocketServer = require("websocket").server;

const httpServer = http.createServer();
httpServer.listen(9090, ()=>console.log("Server listening on 9090."));

const clients = {};
const games = {};

const wsServer = new webSocketServer({
    "httpServer": httpServer
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", ()=>console.log("Connection opened!"));
    connection.on("closed", ()=>console.log("Connection closed!"));
    connection.on("message", message=>{
        const result=JSON.parse(message.utf8Data);
        
        if(result.method==="create"){
            const clientId=result.clientId;
            const gameId=guid();
            games[gameId] = {
                "id":gameId,
                "balls":20,
                "clients":[]
            }
            const payLoad = {
                "method":"create",
                "game":games[gameId]
            }
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }
        //Cliente se va a unir
        if(result.method==="join"){
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            const con = clients[clientId].connection;

            //maximo numero de jugadores: 3
            if(game==null || game.clients.length>=3){
                const payLoad = {
                    "method":"error",
                    "message":"Error. La sala no existe o está llena."
                }
                con.send(JSON.stringify(payLoad));
                return;
            }

            //asignar color a cada cliente
            const color={"0":"Red","1":"Green","2":"Blue"}[game.clients.length];
            game.clients.push({
                "clientId":clientId,
                "color":color
            })
   
            //enviar mensaje a todos los clientes conectados
            const payLoad = {
                "method":"join",
                "game":game
            }
            game.clients.forEach(c=>{
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
    });

    //Generar un clientId
    const clientId=guid();
    clients[clientId]={
        "connection": connection
    };

    const payLoad={
        "method": "connect",
        "clientId": clientId
    };

    //enviar la conexión de usuario
    connection.send(JSON.stringify(payLoad));
});


function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 