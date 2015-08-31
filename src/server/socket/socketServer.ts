import {Server, ServerInstance} from "../../socketLib/socketLibServer";
import http = require('http');
import * as serviceServer from "./serviceServer";
import * as clientService from "../../app/socket/serviceClientContract";
import {allcast} from "./socketServerPush";

export function register(app: http.Server) {
    let clientCreator = (serverInstance: ServerInstance): clientService.contract => {
        return {
            incrementNumber: serverInstance.sendToSocket(clientService.service.incrementNumber)
        };
    };
    let server = new Server(app, serviceServer, clientCreator);
    server.setupAllCast(allcast);
    
    setInterval(() => allcast.hello.emit({ text: 'nice' }), 1000);
}

