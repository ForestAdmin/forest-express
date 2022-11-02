/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import AbstractRecordService from './abstract-records-service';

export default class RecordsCounter extends AbstractRecordService {
  public async count(): Promise<number> {
    const resourcesGetterImplementation = new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      this.params,
      this.user,
    ) as { count: (excludesScope: boolean) => Promise<number> };
    return resourcesGetterImplementation.count(this.excludesScope);
  }
}
