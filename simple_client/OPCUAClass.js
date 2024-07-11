const opcua = require('node-opcua')
const endpoints = "opc.tcp://192.168.1.13:4840"
const client = opcua.OPCUAClient.create(
    {
        applicationName: "PLC-40/Tls-1",
        connectionStrategy: {
            initialDelay: 1000,
            maxRetry: 1
        },
        securityMode: opcua.MessageSecurityMode = "None",
        securityPolicy: opcua.SecurityPolicy = "None",
        endpointMustExist: false
    })


class OpcuaClient {
    constructor(data = []) {
        this.data = data
        client.on('backoff', async (retry, delay) => {
            console.log(`Try to connect to ${endpoints},${retry} next attemp in ${delay / 1000} sec`)
        })
    }
    Device() {
        console.log('entrou no comm')

        client.on('backoff', async (retry, delay) => {
            console.log(`Try to connect to ${endpoints},${retry} next attemp in ${delay / 1000} sec`)
        })

        clienteconnect()

        async function clienteconnect() {
            console.log('entrou no connect')
            client.connect(endpoints, (err) => {
                var msg = err ? console.log(`Cannot to connect to endpoint partner ${endpoints}`)
                    : console.log(`Connected to endpoint partner ${endpoints}`)
                createsession()
            })
        }

        async function createsession() {
            console.log('entrou no create session')

            client.createSession((err, session) => {
                session.createSubscription2()
                if (err) { return }
                var the_session = session
                console.log(`Session ${session.sessionId} Created`)
                readvariables(session)
            })
        }
        async function readvariables(the_session) {

            console.log(`Entrou no readvaribles da sessão: ${the_session.sessionId}`)
            the_session.read({ nodeId: "ns=3;s=\"OPCUA\".BB01_CMD_LIG", attributeId: opcua.AttributeIds.Value }, (err, dataValue) => {
                var msg = err ? console.log('Erro to acess PLC data') : console.log(`BB01_CMD_LIG ${dataValue.value.value}`)
                    + clientSubscription(the_session)
            })
        }
        async function clientSubscription(the_session) {

            console.log(`entrou no subscription`)

            the_session.createSubscription2(
                {
                    requestedPublishingInterval: 1000,
                    requestedLifetimeCount: 1000,
                    requestedMaxKeepAliveCount: 20,
                    maxNotificationsPerPublish: 10,
                    publishingEnabled: true,
                    priority: 10,

                },

                function (err, subscritpion) {
                    if (err) { return (err) }
                    var theSubscription = subscritpion

                    theSubscription.on('keepalive', function () {
                        console.log('keepalive')
                    })
                        .on('terminated', function () {
                            process.exit(0)
                        })
                    monitoring(theSubscription)
                }
            )
        }
        async function monitoring(theSubscription) {
            console.log('entrou no monitoring')

            const ids = ["\"OPCUA\".BB01_CMD_LIG", "\"OPCUA\".BB01_CMD_EMG", "\"OPCUA\".BB01_CMD_MANUT", "\"OPCUA\".BB01_OPERSTATUS", , "\"OPCUA_LEVEL\".LT01", "\"OPCUA_LEVEL\".LT02"
                , "\"OPCUA_LEVEL\".LT03", "\"OPCUA_LEVEL\".LT04", "\"OPCUA_LEVEL\".LT05", "\"OPCUA_LEVEL\".LT06", "\"OPCUA_LEVEL\".LT07"
                , "\"OPCUA_LEVEL\".LT08", "\"OPCUA_LEVEL\".LT09", "\"OPCUA_LEVEL\".LT10"]

            ids.forEach(function (id) {
                var nodeId = 'ns=3;s=' + id

                theSubscription.monitor({
                    nodeId: opcua.resolveNodeId(nodeId),
                    attributeId: opcua.AttributeIds.Value
                },
                    {
                        samplingInterval: 100,
                        discardOldest: true,
                        queueSize: 10,

                    },
                    opcua.TimestampsToReturn.Both,
                    (err, monitoredItems) => {
                        console.log('entrou na callback')
                        if (err) { return `${err}` }
                        console.log('monitorando')
                        monitoredItems
                            .on("changed", function (value) {
                                const data = []
                                console.log('New Value = ', `${id}:` + value.toJSON().value.value)
                                data.push(id + value.toJSON().value.value)
                                this.data = [...data]
                                console.log(this.data.data)
                            },
                            )
                            .on('err', (err) => {
                                console.log('Monitored Item error = ', err.message)
                            })
                    })
            })
        }
    }
}

const PLC_Utilidades = new OpcuaClient()
PLC_Utilidades.Device()






