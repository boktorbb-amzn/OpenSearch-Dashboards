/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { createGetterSetter } from '../../opensearch_dashboards_utils/public';
import { DataPublicPluginStart } from '../../data/public';
import { OpenSearchDashboardsLegacyStart } from '../../opensearch_dashboards_legacy/public';

export const [getDataActions, setDataActions] = createGetterSetter<
  DataPublicPluginStart['actions']
>('vislib data.actions');

export const [getFormatService, setFormatService] = createGetterSetter<
  DataPublicPluginStart['fieldFormats']
>('vislib data.fieldFormats');

export const [getOpenSearchDashboardsLegacy, setOpenSearchDashboardsLegacy] = createGetterSetter<
  OpenSearchDashboardsLegacyStart
>('vislib opensearchDashboardsLegacy');
