import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

/**
 * Datastores are a Slack-hosted location to store
 * and retrieve data for your app.
 * https://api.slack.com/automation/datastores
 */
export const UsersToAlertDatastore = DefineDatastore({
  name: "users_to_alert",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    channel: {
      type: Schema.slack.types.channel_id,
    },
    user_to_alert: {
      type: Schema.slack.types.user_id,
    },
  },
});