import {Observable, Subject} from "rxjs";

export interface ConfirmDialogPayload {
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmCallback: (() => void) | (() => Observable<any>);
}

class ConfirmDialogService {
  subject = new Subject<ConfirmDialogPayload>();

  open(payload: ConfirmDialogPayload) {
    this.subject.next(payload);
  }

  onDialogRequest(): Observable<ConfirmDialogPayload> {
    return this.subject.asObservable();
  }

}

const ConfirmDialog = new ConfirmDialogService();
export default ConfirmDialog;
