/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

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

import { i18n } from '@osd/i18n';
import { Action } from 'src/plugins/ui_actions/public';
import { Start as InspectorStartContract } from 'src/plugins/inspector/public';
import { IEmbeddable } from '../../../embeddables';

export const ACTION_INSPECT_PANEL = 'openInspector';

interface ActionContext {
  embeddable: IEmbeddable;
}

export class InspectPanelAction implements Action<ActionContext> {
  public readonly type = ACTION_INSPECT_PANEL;
  public readonly id = ACTION_INSPECT_PANEL;
  public order = 20;

  constructor(private readonly inspector: InspectorStartContract) {}

  public getDisplayName() {
    return i18n.translate('embeddableApi.panel.inspectPanel.displayName', {
      defaultMessage: 'Inspect',
    });
  }

  public getIconType() {
    return 'inspect';
  }

  public async isCompatible({ embeddable }: ActionContext) {
    return this.inspector.isAvailable(embeddable.getInspectorAdapters());
  }

  public async execute({ embeddable }: ActionContext) {
    const adapters = embeddable.getInspectorAdapters();

    if (!(await this.isCompatible({ embeddable })) || adapters === undefined) {
      throw new Error('Action not compatible with context');
    }

    const session = this.inspector.open(adapters, {
      title: embeddable.getTitle(),
    });
    // Overwrite the embeddables.destroy() function to close the inspector
    // before calling the original destroy method
    const originalDestroy = embeddable.destroy;
    embeddable.destroy = () => {
      session.close();
      if (originalDestroy) {
        originalDestroy.call(embeddable);
      }
    };
    // In case the inspector gets closed (otherwise), restore the original destroy function
    session.onClose.finally(() => {
      embeddable.destroy = originalDestroy;
    });
  }
}
