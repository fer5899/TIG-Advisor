import { Manifest } from "deno-slack-sdk/mod.ts";
import { ListenerSetupWorkflow } from "./workflows/setup_channel_listener.ts";
import { SendAlertWorkflow } from "./workflows/send_alert.ts";
import { UsersToAlertDatastore } from "./datastores/users_to_alert.ts";

export default Manifest({
  name: "TIG Advisor",
  description:
    "TIG Advisor is a Slack app that helps you avoid unnecessary TIGs by alerting you everytime an announcement that notifies against actions that could result in a TIG is posted in a channel.",
  icon: "assets/default_new_app_icon.png",
  workflows: [ListenerSetupWorkflow, SendAlertWorkflow],
  outgoingDomains: [],
  datastores: [UsersToAlertDatastore],
  botScopes: [
    "chat:write",
    "chat:write.public",
    "channels:read",
    "datastore:read",
    "datastore:write",
    "triggers:write",
    "triggers:read",
  ],
});
