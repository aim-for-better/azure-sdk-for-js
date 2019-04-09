/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

import * as msRest from "@azure/ms-rest-js";
import * as Models from "./models";
import * as Mappers from "./models/mappers";
import * as operations from "./operations";
import { AdvisorManagementClientContext } from "./advisorManagementClientContext";


class AdvisorManagementClient extends AdvisorManagementClientContext {
  // Operation groups
  configurations: operations.Configurations;
  recommendations: operations.Recommendations;
  operations: operations.Operations;
  suppressions: operations.Suppressions;

  /**
   * Initializes a new instance of the AdvisorManagementClient class.
   * @param credentials Credentials needed for the client to connect to Azure.
   * @param subscriptionId The Azure subscription ID.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, subscriptionId: string, options?: Models.AdvisorManagementClientOptions) {
    super(credentials, subscriptionId, options);
    this.configurations = new operations.Configurations(this);
    this.recommendations = new operations.Recommendations(this);
    this.operations = new operations.Operations(this);
    this.suppressions = new operations.Suppressions(this);
  }
}

// Operation Specifications

export {
  AdvisorManagementClient,
  AdvisorManagementClientContext,
  Models as AdvisorManagementModels,
  Mappers as AdvisorManagementMappers
};
export * from "./operations";
