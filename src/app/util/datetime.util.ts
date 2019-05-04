/*
 * Copyright: Ambrosus Inc.
 * Email: tech@ambrosus.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as moment from 'moment-timezone';

export const isValidDate = date => moment(date).isValid();

export const getTimestamp = () => moment().unix();

export const timestampToDateString = ts => moment.unix(ts).format('MMMM Do YYYY, h:mm:ss a');

export const getTimestampMonthStart = () =>
    moment()
        .startOf('M')
        .unix();

export const getTimestampDateStart = date =>
    moment(date)
        .startOf('d')
        .unix();

export const getTimestampDateEnd = date =>
    moment(date)
        .endOf('d')
        .unix();

export const getTimestampSubHours = h =>
    moment()
        .subtract(h, 'hours')
        .unix();

export const getTimestampSubDays = d =>
    moment()
        .subtract(d, 'days')
        .unix();

export const getTimestampSubWeeks = w =>
    moment()
        .subtract(w, 'weeks')
        .unix();

export const getTimestampSubMonths = m =>
    moment()
        .subtract(m, 'months')
        .unix();

export const getTimestampAddDays = d =>
    moment()
        .add(d, 'days')
        .unix();
