module wav_io
  implicit none
contains
  subroutine read_wav_mono16(path, sr, x, n, rc)
    character(len=*), intent(in) :: path
    integer, intent(out) :: sr, n, rc
    real, allocatable, intent(out) :: x(:)
    integer :: u, i, ios
    integer(kind=1), allocatable :: hdr(:)
    integer(kind=2) :: s16
    integer :: num_channels, bits_per_sample, data_size

    rc = 0
    sr = 0
    n = 0

    open(newunit=u, file=trim(path), access='stream', form='unformatted', status='old', action='read', iostat=ios)
    if (ios /= 0) then
      rc = 2
      allocate(x(0))
      return
    end if

    allocate(hdr(44))
    read(u, iostat=ios) hdr
    if (ios /= 0) then
      close(u)
      rc = 2
      allocate(x(0))
      return
    end if

    call le32(hdr, 25, sr)
    call le16(hdr, 23, num_channels)
    call le16(hdr, 35, bits_per_sample)
    call le32(hdr, 41, data_size)

    if (num_channels /= 1 .or. bits_per_sample /= 16 .or. data_size <= 0) then
      close(u)
      rc = 2
      allocate(x(0))
      return
    end if

    n = data_size / 2
    allocate(x(n))
    do i = 1, n
      read(u, iostat=ios) s16
      if (ios /= 0) then
        close(u)
        rc = 2
        deallocate(x)
        allocate(x(0))
        return
      end if
      x(i) = real(s16) / 32768.0
    end do
    close(u)
  contains
    subroutine le16(b, pos1, out)
      integer(kind=1), intent(in) :: b(:)
      integer, intent(in) :: pos1
      integer, intent(out) :: out
      integer :: lo, hi
      lo = iand(int(b(pos1), kind=4), 255)
      hi = iand(int(b(pos1+1), kind=4), 255)
      out = lo + 256*hi
    end subroutine

    subroutine le32(b, pos1, out)
      integer(kind=1), intent(in) :: b(:)
      integer, intent(in) :: pos1
      integer, intent(out) :: out
      integer :: b0, b1, b2, b3
      b0 = iand(int(b(pos1), kind=4), 255)
      b1 = iand(int(b(pos1+1), kind=4), 255)
      b2 = iand(int(b(pos1+2), kind=4), 255)
      b3 = iand(int(b(pos1+3), kind=4), 255)
      out = b0 + 256*b1 + 65536*b2 + 16777216*b3
    end subroutine
  end subroutine
end module
