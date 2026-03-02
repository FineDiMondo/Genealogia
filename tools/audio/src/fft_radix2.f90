module fft_radix2
  implicit none
contains
  subroutine fft_inplace(re, im, n)
    integer, intent(in) :: n
    real, intent(inout) :: re(n), im(n)
    integer :: i, j, m, step, half, k
    real :: wr, wi, tr, ti, ang

    j = 1
    do i = 1, n
      if (i < j) then
        call swap(re(i), re(j))
        call swap(im(i), im(j))
      end if
      m = n/2
      do while (m >= 1 .and. j > m)
        j = j - m
        m = m/2
      end do
      j = j + m
    end do

    step = 2
    do while (step <= n)
      half = step/2
      ang = -2.0*acos(-1.0)/real(step)
      do k = 1, half
        wr = cos(ang*real(k-1))
        wi = sin(ang*real(k-1))
        do i = k, n, step
          j = i + half
          tr = wr*re(j) - wi*im(j)
          ti = wr*im(j) + wi*re(j)
          re(j) = re(i) - tr
          im(j) = im(i) - ti
          re(i) = re(i) + tr
          im(i) = im(i) + ti
        end do
      end do
      step = step*2
    end do
  contains
    subroutine swap(a, b)
      real, intent(inout) :: a, b
      real :: t
      t = a
      a = b
      b = t
    end subroutine
  end subroutine
end module
