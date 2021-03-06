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
import * as Models from "../models";
import * as Mappers from "../models/meshVolumeMappers";
import * as Parameters from "../models/parameters";
import { ServiceFabricClientContext } from "../serviceFabricClientContext";

/** Class representing a MeshVolume. */
export class MeshVolume {
  private readonly client: ServiceFabricClientContext;

  /**
   * Create a MeshVolume.
   * @param {ServiceFabricClientContext} client Reference to the service client.
   */
  constructor(client: ServiceFabricClientContext) {
    this.client = client;
  }

  /**
   * Creates a Volume resource with the specified name, description and properties. If Volume
   * resource with the same name exists, then it is updated with the specified description and
   * properties.
   * @summary Creates or updates a Volume resource.
   * @param volumeResourceName The identity of the volume.
   * @param volumeResourceDescription Description for creating a Volume resource.
   * @param [options] The optional parameters
   * @returns Promise<Models.MeshVolumeCreateOrUpdateResponse>
   */
  createOrUpdate(volumeResourceName: string, volumeResourceDescription: Models.VolumeResourceDescription, options?: msRest.RequestOptionsBase): Promise<Models.MeshVolumeCreateOrUpdateResponse>;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param volumeResourceDescription Description for creating a Volume resource.
   * @param callback The callback
   */
  createOrUpdate(volumeResourceName: string, volumeResourceDescription: Models.VolumeResourceDescription, callback: msRest.ServiceCallback<Models.VolumeResourceDescription>): void;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param volumeResourceDescription Description for creating a Volume resource.
   * @param options The optional parameters
   * @param callback The callback
   */
  createOrUpdate(volumeResourceName: string, volumeResourceDescription: Models.VolumeResourceDescription, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.VolumeResourceDescription>): void;
  createOrUpdate(volumeResourceName: string, volumeResourceDescription: Models.VolumeResourceDescription, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.VolumeResourceDescription>, callback?: msRest.ServiceCallback<Models.VolumeResourceDescription>): Promise<Models.MeshVolumeCreateOrUpdateResponse> {
    return this.client.sendOperationRequest(
      {
        volumeResourceName,
        volumeResourceDescription,
        options
      },
      createOrUpdateOperationSpec,
      callback) as Promise<Models.MeshVolumeCreateOrUpdateResponse>;
  }

  /**
   * Gets the information about the Volume resource with the given name. The information include the
   * description and other properties of the Volume.
   * @summary Gets the Volume resource with the given name.
   * @param volumeResourceName The identity of the volume.
   * @param [options] The optional parameters
   * @returns Promise<Models.MeshVolumeGetResponse>
   */
  get(volumeResourceName: string, options?: msRest.RequestOptionsBase): Promise<Models.MeshVolumeGetResponse>;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param callback The callback
   */
  get(volumeResourceName: string, callback: msRest.ServiceCallback<Models.VolumeResourceDescription>): void;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param options The optional parameters
   * @param callback The callback
   */
  get(volumeResourceName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.VolumeResourceDescription>): void;
  get(volumeResourceName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.VolumeResourceDescription>, callback?: msRest.ServiceCallback<Models.VolumeResourceDescription>): Promise<Models.MeshVolumeGetResponse> {
    return this.client.sendOperationRequest(
      {
        volumeResourceName,
        options
      },
      getOperationSpec,
      callback) as Promise<Models.MeshVolumeGetResponse>;
  }

  /**
   * Deletes the Volume resource identified by the name.
   * @summary Deletes the Volume resource.
   * @param volumeResourceName The identity of the volume.
   * @param [options] The optional parameters
   * @returns Promise<msRest.RestResponse>
   */
  deleteMethod(volumeResourceName: string, options?: msRest.RequestOptionsBase): Promise<msRest.RestResponse>;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param callback The callback
   */
  deleteMethod(volumeResourceName: string, callback: msRest.ServiceCallback<void>): void;
  /**
   * @param volumeResourceName The identity of the volume.
   * @param options The optional parameters
   * @param callback The callback
   */
  deleteMethod(volumeResourceName: string, options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<void>): void;
  deleteMethod(volumeResourceName: string, options?: msRest.RequestOptionsBase | msRest.ServiceCallback<void>, callback?: msRest.ServiceCallback<void>): Promise<msRest.RestResponse> {
    return this.client.sendOperationRequest(
      {
        volumeResourceName,
        options
      },
      deleteMethodOperationSpec,
      callback);
  }

  /**
   * Gets the information about all volume resources in a given resource group. The information
   * include the description and other properties of the Volume.
   * @summary Lists all the volume resources.
   * @param [options] The optional parameters
   * @returns Promise<Models.MeshVolumeListResponse>
   */
  list(options?: msRest.RequestOptionsBase): Promise<Models.MeshVolumeListResponse>;
  /**
   * @param callback The callback
   */
  list(callback: msRest.ServiceCallback<Models.PagedVolumeResourceDescriptionList>): void;
  /**
   * @param options The optional parameters
   * @param callback The callback
   */
  list(options: msRest.RequestOptionsBase, callback: msRest.ServiceCallback<Models.PagedVolumeResourceDescriptionList>): void;
  list(options?: msRest.RequestOptionsBase | msRest.ServiceCallback<Models.PagedVolumeResourceDescriptionList>, callback?: msRest.ServiceCallback<Models.PagedVolumeResourceDescriptionList>): Promise<Models.MeshVolumeListResponse> {
    return this.client.sendOperationRequest(
      {
        options
      },
      listOperationSpec,
      callback) as Promise<Models.MeshVolumeListResponse>;
  }
}

// Operation Specifications
const serializer = new msRest.Serializer(Mappers);
const createOrUpdateOperationSpec: msRest.OperationSpec = {
  httpMethod: "PUT",
  path: "Resources/Volumes/{volumeResourceName}",
  urlParameters: [
    Parameters.volumeResourceName
  ],
  queryParameters: [
    Parameters.apiVersion6
  ],
  requestBody: {
    parameterPath: "volumeResourceDescription",
    mapper: {
      ...Mappers.VolumeResourceDescription,
      required: true
    }
  },
  responses: {
    200: {
      bodyMapper: Mappers.VolumeResourceDescription
    },
    201: {
      bodyMapper: Mappers.VolumeResourceDescription
    },
    202: {},
    default: {
      bodyMapper: Mappers.FabricError
    }
  },
  serializer
};

const getOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "Resources/Volumes/{volumeResourceName}",
  urlParameters: [
    Parameters.volumeResourceName
  ],
  queryParameters: [
    Parameters.apiVersion6
  ],
  responses: {
    200: {
      bodyMapper: Mappers.VolumeResourceDescription
    },
    default: {
      bodyMapper: Mappers.FabricError
    }
  },
  serializer
};

const deleteMethodOperationSpec: msRest.OperationSpec = {
  httpMethod: "DELETE",
  path: "Resources/Volumes/{volumeResourceName}",
  urlParameters: [
    Parameters.volumeResourceName
  ],
  queryParameters: [
    Parameters.apiVersion6
  ],
  responses: {
    200: {},
    202: {},
    204: {},
    default: {
      bodyMapper: Mappers.FabricError
    }
  },
  serializer
};

const listOperationSpec: msRest.OperationSpec = {
  httpMethod: "GET",
  path: "Resources/Volumes",
  queryParameters: [
    Parameters.apiVersion6
  ],
  responses: {
    200: {
      bodyMapper: Mappers.PagedVolumeResourceDescriptionList
    },
    default: {
      bodyMapper: Mappers.FabricError
    }
  },
  serializer
};
