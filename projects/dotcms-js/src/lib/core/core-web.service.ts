import {
    Http,
    Response,
    Request,
    Headers,
    RequestOptionsArgs,
    URLSearchParams,
    RequestMethod
} from '@angular/http';
import { Injectable } from '@angular/core';
import { Subject, Observable, throwError } from 'rxjs';
import { map, catchError, filter } from 'rxjs/operators';

import {
    CwError,
    CwError2,
    NETWORK_CONNECTION_ERROR,
    UNKNOWN_RESPONSE_ERROR,
    CLIENTS_ONLY_MESSAGES,
    SERVER_RESPONSE_ERROR
} from './util/http-response-util';
import { ApiRoot } from './api-root.service';
import { ResponseView, ResponseView2 } from './util/response-view';
import { LoggerService } from './logger.service';
import { BrowserUtil } from './browser-util.service';
import { HttpCode } from './util/http-code';
import { Router } from '@angular/router';
import {
    HttpClient,
    HttpRequest,
    HttpHeaders,
    HttpParams,
    HttpResponse,
    HttpEventType,
    HttpEvent
} from '@angular/common/http';

export const RULE_CREATE = 'RULE_CREATE';
export const RULE_DELETE = 'RULE_DELETE';
export const RULE_UPDATE_NAME = 'RULE_UPDATE_NAME';
export const RULE_UPDATE_ENABLED_STATE = 'RULE_UPDATE_ENABLED_STATE';

export const V_RULE_UPDATE_EXPANDED_STATE = 'V_RULE_UPDATE_EXPANDED_STATE';

export const RULE_UPDATE_FIRE_ON = 'RULE_UPDATE_FIRE_ON';

export const RULE_RULE_ACTION_CREATE = 'RULE_RULE_ACTION_CREATE';
export const RULE_RULE_ACTION_DELETE = 'RULE_RULE_ACTION_DELETE';
export const RULE_RULE_ACTION_UPDATE_TYPE = 'RULE_RULE_ACTION_UPDATE_TYPE';
export const RULE_RULE_ACTION_UPDATE_PARAMETER = 'RULE_RULE_ACTION_UPDATE_PARAMETER';

export const RULE_CONDITION_GROUP_UPDATE_OPERATOR = 'RULE_CONDITION_GROUP_UPDATE_OPERATOR';
export const RULE_CONDITION_GROUP_DELETE = 'RULE_CONDITION_GROUP_DELETE';
export const RULE_CONDITION_GROUP_CREATE = 'RULE_CONDITION_GROUP_CREATE';

export const RULE_CONDITION_CREATE = 'RULE_CONDITION_CREATE';
export const RULE_CONDITION_DELETE = 'RULE_CONDITION_DELETE';
export const RULE_CONDITION_UPDATE_TYPE = 'RULE_CONDITION_UPDATE_TYPE';
export const RULE_CONDITION_UPDATE_PARAMETER = 'RULE_CONDITION_UPDATE_PARAMETER';
export const RULE_CONDITION_UPDATE_OPERATOR = 'RULE_CONDITION_UPDATE_OPERATOR';

export interface RequestOptionsParams {
    headers?: HttpHeaders;
    reportProgress?: boolean;
    params?: HttpParams;
    responseType?: 'arraybuffer' | 'blob' | 'text' | 'json';
    withCredentials?: boolean;
}

@Injectable()
export class CoreWebService {
    private httpErrosSubjects: Subject<any>[] = [];

    constructor(
        private _apiRoot: ApiRoot,
        private _http: Http,
        private loggerService: LoggerService,
        private browserUtil: BrowserUtil,
        private router: Router,
        private http: HttpClient
    ) {}

    request(options: any): Observable<any> {
        const request = this.getRequestOpts(options);
        const source = options.body;

        return this._http.request(request).pipe(
            map((resp: Response) => {
                // some endpoints have empty body.
                try {
                    return resp.json();
                } catch (error) {
                    return resp;
                }
            }),
            catchError(
                // tslint:disable-next-line:cyclomatic-complexity
                (response: Response, _original: Observable<any>): Observable<any> => {
                    if (response) {
                        this.handleHttpError(response);
                        if (
                            response.status === HttpCode.SERVER_ERROR ||
                            response.status === HttpCode.FORBIDDEN
                        ) {
                            if (response.text() && response.text().indexOf('ECONNREFUSED') >= 0) {
                                throw new CwError(
                                    NETWORK_CONNECTION_ERROR,
                                    CLIENTS_ONLY_MESSAGES[NETWORK_CONNECTION_ERROR],
                                    request,
                                    response,
                                    source
                                );
                            } else {
                                throw new CwError(
                                    SERVER_RESPONSE_ERROR,
                                    response.json().message,
                                    request,
                                    response,
                                    source
                                );
                            }
                        } else if (response.status === HttpCode.NOT_FOUND) {
                            this.loggerService.error(
                                'Could not execute request: 404 path not valid.',
                                options.url
                            );
                            throw new CwError(
                                UNKNOWN_RESPONSE_ERROR,
                                response.headers.get('error-message'),
                                request,
                                response,
                                source
                            );
                        }
                    }
                    return null;
                }
            )
        );
    }

    request2(options: RequestOptionsArgs): Observable<any> {
        const request = this.getRequestOpts2(options);
        const source = options.body;

        return this.http.request(request).pipe(
            filter(<T>(event: HttpEvent<T>) => event.type === HttpEventType.Response),
            map((resp: HttpResponse<any>) => {
                // some endpoints have empty body.
                try {
                    return resp;
                } catch (error) {
                    return resp;
                }
            }),
            catchError(
                // tslint:disable-next-line:cyclomatic-complexity
                (response: HttpResponse<any>, _original: Observable<any>): Observable<any> => {
                    if (response) {
                        this.handleHttpError(response);
                        if (
                            response.status === HttpCode.SERVER_ERROR ||
                            response.status === HttpCode.FORBIDDEN
                        ) {
                            if (response.statusText && response.statusText.indexOf('ECONNREFUSED') >= 0) {
                                throw new CwError2(
                                    NETWORK_CONNECTION_ERROR,
                                    CLIENTS_ONLY_MESSAGES[NETWORK_CONNECTION_ERROR],
                                    request,
                                    response,
                                    source
                                );
                            } else {
                                throw new CwError2(
                                    SERVER_RESPONSE_ERROR,
                                    response.body.message,
                                    request,
                                    response,
                                    source
                                );
                            }
                        } else if (response.status === HttpCode.NOT_FOUND) {
                            this.loggerService.error(
                                'Could not execute request: 404 path not valid.',
                                options.url
                            );
                            throw new CwError2(
                                UNKNOWN_RESPONSE_ERROR,
                                response.headers.get('error-message'),
                                request,
                                response,
                                source
                            );
                        }
                    }
                    return null;
                }
            )
        );
    }

    /**
     * Return a response adapted to the follow json format:
     *
     * <code>
     * {
     *   "errors":[],
     *   "entity":{},
     *   "messages":[],
     *   "i18nMessagesMap":{}
     * }
     * </code>
     *
     * @param options
     * @returns DotCMSHttpResponse
     */
    public requestView(options: RequestOptionsArgs): Observable<ResponseView> {
        const request = this.getRequestOpts(options);

        return this._http.request(request).pipe(
            map((resp) => {
                if (resp.json().errors && resp.json().errors.length > 0) {
                    return this.handleRequestViewErrors(resp);
                } else {
                    return new ResponseView(resp);
                }
            }),
            catchError((err: Response) => throwError(this.handleRequestViewErrors(err)))
        );
    }

    public requestView2(options: RequestOptionsArgs): Observable<ResponseView2> {
        const request = this.getRequestOpts2(options);
        debugger
        return this.http.request(request).pipe(
            filter(<T>(event: HttpEvent<T>) => event.type === HttpEventType.Response),
            map((resp: HttpResponse<any>) => {
                if (resp.body && resp.body.errors && resp.body.errors.length > 0) {
                    return this.handleRequestViewErrors2(resp);
                } else {
                    return new ResponseView2(resp);
                }
            }),
            catchError((err: Response) => {
                return throwError(this.handleRequestViewErrors(err));
            })
        );
    }

    public subscribeTo(httpErrorCode: number): Observable<any> {
        if (!this.httpErrosSubjects[httpErrorCode]) {
            this.httpErrosSubjects[httpErrorCode] = new Subject();
        }

        return this.httpErrosSubjects[httpErrorCode].asObservable();
    }

    private handleRequestViewErrors(resp: Response): ResponseView {
        if (resp.status === 401) {
            this.router.navigate(['/public/login']);
        }

        return new ResponseView(resp);
    }

    private handleRequestViewErrors2<T>(resp: HttpResponse<T>): ResponseView2 {
        if (resp.status === 401) {
            this.router.navigate(['/public/login']);
        }

        return new ResponseView2(resp);
    }

    // tslint:disable-next-line:cyclomatic-complexity
    private getRequestOpts(options: RequestOptionsArgs): Request {
        const headers: Headers = this._apiRoot.getDefaultRequestHeaders();
        const tempHeaders = options.headers
            ? options.headers
            : { 'Content-Type': 'application/json' };

        Object.keys(tempHeaders).forEach((key) => {
            headers.set(key, tempHeaders[key]);
        });

        // https://github.com/angular/angular/issues/10612#issuecomment-238712920
        options.body =
            options.body && typeof options.body !== 'string'
                ? JSON.stringify(options.body)
                : options.body
                ? options.body
                : '';

        options.headers = headers;

        if (options.url.indexOf('://') === -1) {
            options.url = options.url.startsWith('/api')
                ? `${this._apiRoot.baseUrl}${options.url.substr(1)}`
                : `${this._apiRoot.baseUrl}api/${options.url}`;
        }

        if (this.browserUtil.isIE11()) {
            options = options || {};
            options.search = options.search || new URLSearchParams();
            const currentTime = new Date().getTime();
            (<URLSearchParams>options.search).set('timestamp', String(currentTime));
        }

        return new Request(<any>options);
    }

    private handleHttpError(response): void {
        if (!this.httpErrosSubjects[response.status]) {
            this.httpErrosSubjects[response.status] = new Subject();
        }

        this.httpErrosSubjects[response.status].next(response);
    }

    // tslint:disable-next-line:cyclomatic-complexity
    private getRequestOpts2(options: RequestOptionsArgs): HttpRequest<any> {
        let headers: HttpHeaders = this._apiRoot.getDefaultRequestHeaders2();
        const tempHeaders = options.headers
            ? options.headers
            : { 'Content-Type': 'application/json' };

        Object.keys(tempHeaders).forEach((key) => {
            headers = headers.set(key, tempHeaders[key]);
        });

        // https://github.com/angular/angular/issues/10612#issuecomment-238712920
        const body =
            options.body && typeof options.body !== 'string'
                ? JSON.stringify(options.body)
                : options.body
                ? options.body
                : '';

        if (options.url.indexOf('://') === -1) {
            options.url = options.url.startsWith('/api')
                ? `${this._apiRoot.baseUrl}${options.url.substr(1)}`
                : `${this._apiRoot.baseUrl}api/${options.url}`;
        }

        if (this.browserUtil.isIE11()) {
            options = options || {};
            let searchOptions = new HttpParams();
            Object.keys(options.search).forEach((key) => {
                searchOptions = searchOptions.set(key, tempHeaders[key]);
            });
            const currentTime = new Date().getTime();
            options.params = searchOptions.set('timestamp', String(currentTime));
        }

        const optionsArgs: RequestOptionsParams = {
            headers,
            params: new HttpParams()
        };

        if (options.params) {
            Object.keys(options.params).forEach((key) => {
                optionsArgs.params = optionsArgs.params.set(key, options.params[key]);
            });
        }

        return new HttpRequest(RequestMethod[options.method], options.url, body, optionsArgs);
    }
}
