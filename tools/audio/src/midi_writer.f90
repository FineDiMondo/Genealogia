module midi_writer
  implicit none
contains
  subroutine write_midi_type0(path, notes, nnotes, ppq, bpm, program, rc)
    character(len=*), intent(in) :: path
    integer, intent(in) :: nnotes, ppq, bpm, program
    integer, intent(in) :: notes(nnotes,4)
    integer, intent(out) :: rc

    integer :: u, ios
    integer, allocatable :: track(:)
    integer :: idx, tlen, i, dt, last_tick
    integer :: tempo_us

    rc = 0
    tempo_us = int(60000000.0/real(max(bpm, 1)))

    open(newunit=u, file=trim(path), access='stream', form='unformatted', status='replace', action='write', iostat=ios)
    if (ios /= 0) then
      rc = 3
      return
    end if

    call put_str(u, 'MThd', ios); if (ios /= 0) then; rc = 3; close(u); return; end if
    call put_u32be(u, 6, ios); if (ios /= 0) then; rc = 3; close(u); return; end if
    call put_u16be(u, 0, ios); if (ios /= 0) then; rc = 3; close(u); return; end if
    call put_u16be(u, 1, ios); if (ios /= 0) then; rc = 3; close(u); return; end if
    call put_u16be(u, ppq, ios); if (ios /= 0) then; rc = 3; close(u); return; end if

    allocate(track(1024*1024))
    idx = 1

    call put_vlq(track, idx, 0)
    call put_byte(track, idx, int(z'FF'))
    call put_byte(track, idx, int(z'51'))
    call put_byte(track, idx, 3)
    call put_byte(track, idx, iand(ishft(tempo_us, -16), 255))
    call put_byte(track, idx, iand(ishft(tempo_us, -8), 255))
    call put_byte(track, idx, iand(tempo_us, 255))

    call put_vlq(track, idx, 0)
    call put_byte(track, idx, int(z'C0'))
    call put_byte(track, idx, iand(program, 127))

    last_tick = 0
    do i = 1, nnotes
      dt = notes(i,1) - last_tick
      if (dt < 0) dt = 0

      call put_vlq(track, idx, dt)
      call put_byte(track, idx, int(z'90'))
      call put_byte(track, idx, iand(notes(i,3), 127))
      call put_byte(track, idx, iand(notes(i,4), 127))
      last_tick = notes(i,1)

      call put_vlq(track, idx, max(notes(i,2), 1))
      call put_byte(track, idx, int(z'80'))
      call put_byte(track, idx, iand(notes(i,3), 127))
      call put_byte(track, idx, 0)
      last_tick = last_tick + max(notes(i,2), 1)
    end do

    call put_vlq(track, idx, 0)
    call put_byte(track, idx, int(z'FF'))
    call put_byte(track, idx, int(z'2F'))
    call put_byte(track, idx, 0)

    tlen = idx - 1
    call put_str(u, 'MTrk', ios); if (ios /= 0) then; rc = 3; close(u); deallocate(track); return; end if
    call put_u32be(u, tlen, ios); if (ios /= 0) then; rc = 3; close(u); deallocate(track); return; end if
    call put_bytes(u, track, tlen, ios); if (ios /= 0) then; rc = 3; close(u); deallocate(track); return; end if

    close(u)
    deallocate(track)
  contains
    subroutine put_str(u, s, ios)
      integer, intent(in) :: u
      character(len=*), intent(in) :: s
      integer, intent(out) :: ios
      integer :: i
      ios = 0
      do i = 1, len(s)
        write(u, iostat=ios) s(i:i)
        if (ios /= 0) return
      end do
    end subroutine

    subroutine put_u16be(u, v, ios)
      integer, intent(in) :: u, v
      integer, intent(out) :: ios
      character(len=1) :: c
      ios = 0
      c = achar(iand(ishft(v, -8), 255)); write(u, iostat=ios) c; if (ios /= 0) return
      c = achar(iand(v, 255));           write(u, iostat=ios) c
    end subroutine

    subroutine put_u32be(u, v, ios)
      integer, intent(in) :: u, v
      integer, intent(out) :: ios
      character(len=1) :: c
      ios = 0
      c = achar(iand(ishft(v, -24), 255)); write(u, iostat=ios) c; if (ios /= 0) return
      c = achar(iand(ishft(v, -16), 255)); write(u, iostat=ios) c; if (ios /= 0) return
      c = achar(iand(ishft(v, -8), 255));  write(u, iostat=ios) c; if (ios /= 0) return
      c = achar(iand(v, 255));             write(u, iostat=ios) c
    end subroutine

    subroutine put_bytes(u, a, n, ios)
      integer, intent(in) :: u, n
      integer, intent(in) :: a(:)
      integer, intent(out) :: ios
      integer :: i
      character(len=1) :: c
      ios = 0
      do i = 1, n
        c = achar(iand(a(i), 255))
        write(u, iostat=ios) c
        if (ios /= 0) return
      end do
    end subroutine

    subroutine put_byte(a, idx, b)
      integer, intent(inout) :: a(:)
      integer, intent(inout) :: idx
      integer, intent(in) :: b
      a(idx) = iand(b, 255)
      idx = idx + 1
    end subroutine

    subroutine put_vlq(a, idx, v)
      integer, intent(inout) :: a(:)
      integer, intent(inout) :: idx
      integer, intent(in) :: v
      integer :: bytes(5), n, x

      x = max(v, 0)
      n = 1
      bytes(1) = iand(x, 127)
      x = ishft(x, -7)
      do while (x > 0 .and. n < 5)
        n = n + 1
        bytes(n) = ior(iand(x, 127), 128)
        x = ishft(x, -7)
      end do

      do while (n >= 1)
        call put_byte(a, idx, bytes(n))
        n = n - 1
      end do
    end subroutine
  end subroutine
end module
