import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {

  @Input() currentPage: Number;
  @Input() pagination;
  @Input() method: (inputPage) => any;
  minPage: Number = 1;

  constructor() { }

  ngOnInit() {
  }

  keyPress(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
        event.preventDefault();
    }
  }

  changePage(input) {
    if (input === 'next') {
      this.method(+this.currentPage + 1);
      this.currentPage = +this.currentPage + 1;
    } else if (input === 'back') {
      this.method(+this.currentPage - 1);
      this.currentPage = +this.currentPage - 1;
    }
  }

  pageValue(event: any) {
    this.currentPage = event.target.value;
    this.method(+this.currentPage - 1);
  }

}
