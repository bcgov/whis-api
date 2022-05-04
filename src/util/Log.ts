import {createLogger, format, transports} from 'winston';

export const log = createLogger({
	level: 'debug',
	transports: [
		new transports.Console({
			level: 'info',
			format: format.combine(format.colorize(), format.splat())
		})
	]
});
