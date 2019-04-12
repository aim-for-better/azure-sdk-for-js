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
import { ImageBuilderClientContext } from "./imageBuilderClientContext";


class ImageBuilderClient extends ImageBuilderClientContext {
  // Operation groups
  virtualMachineImageTemplates: operations.VirtualMachineImageTemplates;
  operations: operations.Operations;

  /**
   * Initializes a new instance of the ImageBuilderClient class.
   * @param credentials Credentials needed for the client to connect to Azure.
   * @param subscriptionId Subscription credentials which uniquely identify Microsoft Azure
   * subscription. The subscription Id forms part of the URI for every service call.
   * @param [options] The parameter options
   */
  constructor(credentials: msRest.ServiceClientCredentials, subscriptionId: string, options?: Models.ImageBuilderClientOptions) {
    super(credentials, subscriptionId, options);
    this.virtualMachineImageTemplates = new operations.VirtualMachineImageTemplates(this);
    this.operations = new operations.Operations(this);
  }
}

// Operation Specifications

export {
  ImageBuilderClient,
  ImageBuilderClientContext,
  Models as ImageBuilderModels,
  Mappers as ImageBuilderMappers
};
export * from "./operations";
