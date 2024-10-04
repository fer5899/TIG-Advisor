import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SendAlertFunction } from "../functions/send_alert.ts";

/**
 * The SendWelcomeMessageWorkFlow will retrieve the welcome message
 * from the datastore and send it to the specified channel, when
 * a new user joins the channel.
 */
export const SendAlertWorkflow = DefineWorkflow({
  callback_id: "send_alert_workflow",
  title: "Send Alert",
  description:
    "Sends a dm to the user who set up the alert when a TIG message is sent.",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
      },
      triggered_user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["channel", "triggered_user"],
  },
});

/**
 * This step uses the SendWelcomeMessageFunction to send the welcome
 * message to the new user.
 */
SendAlertWorkflow.addStep(SendAlertFunction, {
  channel: SendAlertWorkflow.inputs.channel,
  triggered_user: SendAlertWorkflow.inputs.triggered_user,
});
