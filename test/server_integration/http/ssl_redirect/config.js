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

import Url from 'url';
import { readFileSync } from 'fs';
import { CA_CERT_PATH, OSD_CERT_PATH, OSD_KEY_PATH } from '@osd/dev-utils';

import { createOpenSearchDashboardsSupertestProvider } from '../../services';

export default async function ({ readConfigFile }) {
  const httpConfig = await readConfigFile(require.resolve('../../config'));
  const certificateAuthorities = [readFileSync(CA_CERT_PATH)];

  const redirectPort = httpConfig.get('servers.opensearchDashboards.port') + 1234;

  return {
    testFiles: [require.resolve('./')],
    services: {
      ...httpConfig.get('services'),
      supertest: createOpenSearchDashboardsSupertestProvider({
        certificateAuthorities,
        opensearchDashboardsUrl: Url.format({
          ...httpConfig.get('servers.opensearchDashboards'),
          port: redirectPort,
          // test with non ssl protocol
          protocol: 'http',
        }),
      }),
    },
    servers: {
      ...httpConfig.get('servers'),
      opensearchDashboards: {
        ...httpConfig.get('servers.opensearchDashboards'),
        // start the server with https
        protocol: 'https',
        certificateAuthorities,
      },
    },
    junit: {
      reportName: 'Http SSL Integration Tests',
    },
    opensearchTestCluster: httpConfig.get('opensearchTestCluster'),
    osdTestServer: {
      ...httpConfig.get('osdTestServer'),
      serverArgs: [
        ...httpConfig.get('osdTestServer.serverArgs'),
        '--server.ssl.enabled=true',
        `--server.ssl.key=${OSD_KEY_PATH}`,
        `--server.ssl.certificate=${OSD_CERT_PATH}`,
        `--server.ssl.redirectHttpFromPort=${redirectPort}`,
      ],
    },
  };
}
