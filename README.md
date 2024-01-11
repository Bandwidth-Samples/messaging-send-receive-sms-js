# Send and Receive SMS

<a href="http://dev.bandwidth.com/docs/messaging/quickStart">
  <img src="./icon-messaging.svg" title="Messaging Quick Start Guide" alt="Messaging Quick Start Guide"/>
</a>

 # Table of Contents

* [Description](#description)
* [Pre-Requisites](#pre-requisites)
* [Running the Application](#running-the-application)
* [Environmental Variables](#environmental-variables)
* [Callback URLs](#callback-urls)
  * [Ngrok](#ngrok)

# Description

Using a tool capable of making POST requests such as [Postman](https://www.postman.com/), send a `POST` request to the `/sendMessage` endpoint with a json body containing the `to` and `text` fields. The `to` field should be an array of E.164 formatted phone numbers to send the SMS to.

```json
{
  "to": ["+19195551234"],
  "text": "Hello World!"
}
```

The example above will text the number `+19195551234` the words `Hello World!`.

The other two endpoints are used for handling inbound and outbound webhooks from Bandwidth. In order to use the correct endpoints, you must check the "Use multiple callback URLs" box on the application page in Dashboard. Then in Dashboard, set the INBOUND CALLBACK to `/callbacks/inbound/messaging` and the STATUS CALLBACK to `/callbacks/outbound/messaging/status`. The same can be accomplished via the Dashboard API by setting InboundCallbackUrl and OutboundCallbackUrl respectively.

Inbound callbacks are sent notifying you of a received message on a Bandwidth number, this app prints the phone numbers involved, as well as the text received. Outbound callbacks are status updates for messages sent from a Bandwidth number, this app has a dedicated response for each type of status update.

# Pre-Requisites

In order to use the Bandwidth API users need to set up the appropriate application at the [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and create API tokens.

To create an application log into the [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and navigate to the `Applications` tab.  Fill out the **New Application** form selecting the service (Messaging or Voice) that the application will be used for.  All Bandwidth services require publicly accessible Callback URLs, for more information on how to set one up see [Callback URLs](#callback-urls).

For more information about API credentials see our [Account Credentials](https://dev.bandwidth.com/docs/account/credentials) page.

# Running the Application

To install the required packages for this app, run the command:

```sh
npm i
```

Use the following command to run the application:

```sh
npm start
```

# Environmental Variables

The sample app uses the below environmental variables.

```sh
BW_ACCOUNT_ID                        # Your Bandwidth Account Id
BW_USERNAME                          # Your Bandwidth API Username
BW_PASSWORD                          # Your Bandwidth API Password
BW_NUMBER                            # The Bandwidth phone number involved with this application
BW_MESSAGING_APPLICATION_ID          # Your Messaging Application Id created in the dashboard
LOCAL_PORT                           # The port number you wish to run the sample on
```

# Callback URLs

For a detailed introduction, check out our [Bandwidth Messaging Callbacks](https://dev.bandwidth.com/docs/messaging/webhooks) page.

Below are the callback paths:
* `/callbacks/outbound/messaging/status` For Outbound Status Callbacks
* `/callbacks/inbound/messaging` For Inbound Message Callbacks

## Ngrok

A simple way to set up a local callback URL for testing is to use the free tool [ngrok](https://ngrok.com/).  
After you have downloaded and installed `ngrok` run the following command to open a public tunnel to your port (`$LOCAL_PORT`)

```cmd
ngrok http $LOCAL_PORT
```

You can view your public URL at `http://127.0.0.1:4040` after ngrok is running.  You can also view the status of the tunnel and requests/responses here. Once your public ngrok url has been created, you can use it as the `BASE_CALLBACK_URL` environmental variable and set it in the voice application created in the [Pre-Requisites](#pre-requisites) section.
