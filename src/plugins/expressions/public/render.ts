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

import * as Rx from 'rxjs';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ExpressionRenderError, RenderErrorHandlerFnType, IExpressionLoaderParams } from './types';
import { renderErrorHandler as defaultRenderErrorHandler } from './render_error_handler';
import { IInterpreterRenderHandlers, ExpressionAstExpression } from '../common';

import { getRenderersRegistry } from './services';

export type IExpressionRendererExtraHandlers = Record<string, any>;

export interface ExpressionRenderHandlerParams {
  onRenderError: RenderErrorHandlerFnType;
}

export interface ExpressionRendererEvent {
  name: string;
  data: any;
}

interface UpdateValue {
  newExpression?: string | ExpressionAstExpression;
  newParams: IExpressionLoaderParams;
}

export class ExpressionRenderHandler {
  render$: Observable<number>;
  update$: Observable<UpdateValue | null>;
  events$: Observable<ExpressionRendererEvent>;

  private element: HTMLElement;
  private destroyFn?: any;
  private renderCount: number = 0;
  private renderSubject: Rx.BehaviorSubject<number | null>;
  private eventsSubject: Rx.Subject<unknown>;
  private updateSubject: Rx.Subject<UpdateValue | null>;
  private handlers: IInterpreterRenderHandlers;
  private onRenderError: RenderErrorHandlerFnType;

  constructor(
    element: HTMLElement,
    { onRenderError }: Partial<ExpressionRenderHandlerParams> = {}
  ) {
    this.element = element;

    this.eventsSubject = new Rx.Subject();
    this.events$ = this.eventsSubject.asObservable() as Observable<ExpressionRendererEvent>;

    this.onRenderError = onRenderError || defaultRenderErrorHandler;

    this.renderSubject = new Rx.BehaviorSubject(null as any | null);
    this.render$ = this.renderSubject.asObservable().pipe(filter((_) => _ !== null)) as Observable<
      any
    >;

    this.updateSubject = new Rx.Subject();
    this.update$ = this.updateSubject.asObservable();

    this.handlers = {
      onDestroy: (fn: any) => {
        this.destroyFn = fn;
      },
      done: () => {
        this.renderCount++;
        this.renderSubject.next(this.renderCount);
      },
      reload: () => {
        this.updateSubject.next(null);
      },
      update: (params) => {
        this.updateSubject.next(params);
      },
      event: (data) => {
        this.eventsSubject.next(data);
      },
    };
  }

  render = async (data: any, uiState: any = {}) => {
    if (!data || typeof data !== 'object') {
      return this.handleRenderError(new Error('invalid data provided to the expression renderer'));
    }

    if (data.type !== 'render' || !data.as) {
      if (data.type === 'error') {
        return this.handleRenderError(data.error);
      } else {
        return this.handleRenderError(
          new Error('invalid data provided to the expression renderer')
        );
      }
    }

    if (!getRenderersRegistry().get(data.as)) {
      return this.handleRenderError(new Error(`invalid renderer id '${data.as}'`));
    }

    try {
      // Rendering is asynchronous, completed by handlers.done()
      await getRenderersRegistry()
        .get(data.as)!
        .render(this.element, data.value, {
          ...this.handlers,
          uiState,
        } as any);
    } catch (e) {
      return this.handleRenderError(e);
    }
  };

  destroy = () => {
    this.renderSubject.complete();
    this.eventsSubject.complete();
    this.updateSubject.complete();
    if (this.destroyFn) {
      this.destroyFn();
    }
  };

  getElement = () => {
    return this.element;
  };

  handleRenderError = (error: ExpressionRenderError) => {
    this.onRenderError(this.element, error, this.handlers);
  };
}

export function render(
  element: HTMLElement,
  data: any,
  options?: Partial<ExpressionRenderHandlerParams>
): ExpressionRenderHandler {
  const handler = new ExpressionRenderHandler(element, options);
  handler.render(data);
  return handler;
}
