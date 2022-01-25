import { Request, Response } from 'express';


/* ## notFound
  Catch-all router for any request that does not have an endpoint defined.
  @param req {object} Node/Express request object
  @param res {object} Node/Express response object
*/
const notFound = function (req: Request, res: Response): Response {
  return res.status(404).json({ error: 'Express start.ts says: Sorry, but you must be lost' });
};


export {  
  notFound  
};
