# MySQL schema cho sinh vien va giang vien

Thu muc nay chua schema de sau nay chuyen backend sang MySQL.

## File chinh

- `schema_mysql.sql`: Tao database `mentorai_grad`, bang `users`, `students`, `lecturers` va them du lieu mau.

## Cau truc du lieu

### `users`

Bang dung chung cho dang nhap va xac thuc:

- `email`: duy nhat
- `password_hash`: luu mat khau da bam
- `full_name`: ho ten
- `role`: `student` hoac `teacher`
- `is_active`: trang thai tai khoan

### `students`

Bang thong tin rieng cho sinh vien:

- `user_id`: lien ket 1-1 toi `users.id`
- `student_code`: ma sinh vien
- `major`: nganh hoc
- `class_name`: lop
- `enrollment_year`: nam nhap hoc
- `phone`, `date_of_birth`: thong tin bo sung

### `lecturers`

Bang thong tin rieng cho giang vien:

- `user_id`: lien ket 1-1 toi `users.id`
- `lecturer_code`: ma giang vien
- `department`: khoa / bo mon
- `specialization`: chuyen mon
- `academic_title`: hoc ham hoc vi
- `phone`, `office_address`: thong tin bo sung

## Cach import vao MySQL

Chay trong MySQL shell hoac command line:

```sql
SOURCE d:/MGA.cap2/database/schema_mysql.sql;
```

Hoac:

```bash
mysql -u root -p < d:/MGA.cap2/database/schema_mysql.sql
```

## Cach map voi backend sau nay

- Dang ky: insert vao `users`, sau do insert vao `students` hoac `lecturers` theo `role`. Ban co the tao ngay mot dong profile chi gom `user_id`, cac cot con lai de `NULL`.
- Dang nhap: query bang `users` theo `email`, so sanh `password_hash`.
- Lay profile: join `users` voi bang chi tiet tuong ung.

## Goi y API sau nay

- Neu form dang ky hien tai chi co `email`, `password`, `fullName`, `role` thi van insert duoc.
- Cac cot nhu `student_code`, `major`, `department` dang de `NULL` de bo sung sau.