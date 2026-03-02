program wav2midi_fft
  use wav_io
  use fft_radix2
  use midi_writer
  implicit none

  character(len=512) :: wav_path, midi_path, arg
  integer :: sr, n, bpm, rc
  real, allocatable :: x(:)

  integer, parameter :: NFFT = 4096
  integer, parameter :: HOP = 1024
  real :: win(NFFT), re(NFFT), im(NFFT)
  integer :: frames, f, i
  real :: maxv, mag, gate
  integer :: kmax
  real :: freq
  integer :: ppq, program

  integer, allocatable :: notes(:,:)
  integer :: nnotes, cap
  integer :: last_note, cur_note
  integer :: start_tick, cur_tick, dur_tick
  real :: hop_time
  real :: energy
  integer :: vel
  integer :: ticks_per_hop

  call getarg(1, wav_path)
  call getarg(2, midi_path)
  call getarg(3, arg)

  if (len_trim(wav_path) == 0) then
    write(*,'(A)') 'ERROR: missing WAV input'
    stop 2
  end if
  if (len_trim(midi_path) == 0) midi_path = 'tools/audio/out/output.mid'

  if (len_trim(arg) == 0) then
    bpm = 120
  else
    read(arg,*,iostat=rc) bpm
    if (rc /= 0 .or. bpm <= 0) bpm = 120
  end if

  call read_wav_mono16(trim(wav_path), sr, x, n, rc)
  if (rc /= 0) then
    write(*,'(A)') 'ERROR: cannot read WAV mono16'
    stop 2
  end if

  do i = 1, NFFT
    win(i) = 0.5 - 0.5*cos(2.0*acos(-1.0)*real(i-1)/real(NFFT-1))
  end do

  frames = (n - NFFT) / HOP
  if (frames < 1) then
    write(*,'(A)') 'WARN: audio too short'
    stop 1
  end if

  ppq = 480
  program = 81
  hop_time = real(HOP)/real(sr)
  ticks_per_hop = max(1, int(hop_time * (real(bpm)/60.0) * real(ppq)))

  gate = 0.02

  cap = 2048
  allocate(notes(cap,4))
  nnotes = 0

  last_note = -1
  start_tick = 0
  cur_tick = 0

  do f = 0, frames-1
    energy = 0.0
    do i = 1, NFFT
      re(i) = x(1 + f*HOP + (i-1)) * win(i)
      im(i) = 0.0
      energy = energy + abs(re(i))
    end do
    energy = energy / real(NFFT)

    call fft_inplace(re, im, NFFT)

    maxv = 0.0
    kmax = 0
    do i = 2, NFFT/2
      mag = sqrt(re(i)*re(i) + im(i)*im(i))
      if (mag > maxv) then
        maxv = mag
        kmax = i
      end if
    end do

    cur_tick = f * ticks_per_hop

    if (maxv < gate .or. kmax == 0 .or. energy < gate) then
      if (last_note /= -1) then
        dur_tick = max(ticks_per_hop, cur_tick - start_tick)
        call quantize_dur_16(dur_tick, ppq)
        call push_note(notes, nnotes, cap, start_tick, dur_tick, last_note, 64)
        last_note = -1
      end if
      cycle
    end if

    freq = (real(kmax-1) * real(sr)) / real(NFFT)
    cur_note = freq_to_midi(freq)
    if (cur_note < 0) cycle

    vel = vel_from_energy(energy)

    if (last_note == -1) then
      start_tick = cur_tick
      last_note = cur_note
    else
      if (abs(cur_note - last_note) >= 1) then
        dur_tick = max(ticks_per_hop, cur_tick - start_tick)
        call quantize_dur_16(dur_tick, ppq)
        call push_note(notes, nnotes, cap, start_tick, dur_tick, last_note, vel)
        start_tick = cur_tick
        last_note = cur_note
      end if
    end if
  end do

  if (last_note /= -1) then
    dur_tick = ticks_per_hop
    call quantize_dur_16(dur_tick, ppq)
    call push_note(notes, nnotes, cap, start_tick, dur_tick, last_note, 64)
  end if

  if (nnotes <= 0) then
    write(*,'(A)') 'WARN: no notes extracted'
    stop 1
  end if

  call sort_notes(notes, nnotes)
  call write_midi_type0(trim(midi_path), notes, nnotes, ppq, bpm, program, rc)
  if (rc /= 0) then
    write(*,'(A)') 'ERROR: cannot write midi file'
    stop 3
  end if

  write(*,'(A,I0)') 'INFO: notes written = ', nnotes
  if (nnotes < 5) then
    stop 1
  end if

  stop 0

contains
  integer function freq_to_midi(fr)
    real, intent(in) :: fr
    real :: m
    if (fr <= 0.0) then
      freq_to_midi = -1
      return
    end if
    m = 69.0 + 12.0*log(fr/440.0)/log(2.0)
    freq_to_midi = nint(m)
    if (freq_to_midi < 0 .or. freq_to_midi > 127) freq_to_midi = -1
  end function

  integer function vel_from_energy(e)
    real, intent(in) :: e
    if (e < 0.03) then
      vel_from_energy = 32
    else if (e < 0.06) then
      vel_from_energy = 64
    else if (e < 0.10) then
      vel_from_energy = 96
    else
      vel_from_energy = 127
    end if
  end function

  subroutine quantize_dur_16(dur, ppq)
    integer, intent(inout) :: dur
    integer, intent(in) :: ppq
    integer :: grid
    grid = max(1, ppq/4)
    dur = int((real(dur) / real(grid)) + 0.5) * grid
    if (dur < grid) dur = grid
  end subroutine

  subroutine push_note(a, used, cap, st, dur, note, vel)
    integer, allocatable, intent(inout) :: a(:,:)
    integer, intent(inout) :: used, cap
    integer, intent(in) :: st, dur, note, vel
    integer, allocatable :: b(:,:)
    integer :: d

    d = dur
    if (d < 30) return

    if (used >= cap) then
      cap = cap*2
      allocate(b(cap,4))
      b = 0
      b(1:used,1:4) = a(1:used,1:4)
      call move_alloc(b, a)
    end if

    used = used + 1
    a(used,1) = max(0, st)
    a(used,2) = max(1, d)
    a(used,3) = max(0, min(127, note))
    a(used,4) = max(1, min(127, vel))
  end subroutine

  subroutine sort_notes(a, used)
    integer, intent(in) :: used
    integer, intent(inout) :: a(used,4)
    integer :: i, j
    integer :: tmp(4)
    do i = 2, used
      tmp = a(i,1:4)
      j = i-1
      do while (j >= 1 .and. a(j,1) > tmp(1))
        a(j+1,1:4) = a(j,1:4)
        j = j-1
      end do
      a(j+1,1:4) = tmp
    end do
  end subroutine
end program
