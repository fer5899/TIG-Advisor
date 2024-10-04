import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ListenerSetupFunction } from "../functions/setup_channel_listener.ts";

/**
 * The ListenerSetupWorkflow opens a form where the user defines
 * the channel to listen for TIG announcements. The trigger for this
 * workflow is found in `/triggers/setup_channel_listener_shortcut.ts`
 */
export const ListenerSetupWorkflow = DefineWorkflow({
  callback_id: "setup_channel_listener_workflow",
  title: "Setup Channel Listener",
  description: "Defines the channel to listen for TIG announcements.",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity"],
  },
});

/**
 * This step uses the OpenForm Slack function. The form has one
 * input -- a channel id for the bot to listen for TIG announcements.
 */
const SetupWorkflowForm = ListenerSetupWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Welcome Message Form",
    submit_label: "Submit",
    description: ":wave: Select a channel to listen for TIG announcements!",
    interactivity: ListenerSetupWorkflow.inputs.interactivity,
    fields: {
      required: ["channel"],
      elements: [
        {
          name: "channel",
          title: "Select a channel to listen for TIG announcements",
          type: Schema.slack.types.channel_id,
          default: ListenerSetupWorkflow.inputs.channel,
        },
      ],
    },
  },
);

/**
 * This step uses the ListenerSetupFunction custom function. The
 * function takes the initial form input, and creates an event
 * trigger to listen for whenever a message is posted in the
 * specified channel and contains the word "TIG".
 */
ListenerSetupWorkflow.addStep(ListenerSetupFunction, {
  channel: SetupWorkflowForm.outputs.fields.channel,
  user_to_alert: ListenerSetupWorkflow.inputs.interactivity.interactor.id,
});

/**
 * This step uses the SendDm Slack function. The function sends a
 * direct message to the user who initiated the workflow, letting
 * them know that the bot is all set up and ready to go.
 */
ListenerSetupWorkflow.addStep(Schema.slack.functions.SendDm, {
  user_id: ListenerSetupWorkflow.inputs.interactivity.interactor.id,
  message: `TIG Advisor is all set and ready! :white_check_mark:`,
});

export default ListenerSetupWorkflow;
